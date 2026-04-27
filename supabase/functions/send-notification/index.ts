import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_URL = "https://connector-gateway.lovable.dev/resend/emails";

const FROM_EMAIL =
  Deno.env.get("RESEND_FROM_EMAIL") || "EntreVault <support@entrevault.online>";

// Broadcast-type notifications check broadcasts_enabled preference.
// Everything else (account, task result, withdrawal) is transactional.
const BROADCAST_TYPES = new Set(["broadcast", "new_task", "task_closed"]);

interface NotificationBody {
  userId?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
  broadcast?: boolean;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildEmailHtml(opts: {
  name: string;
  title: string;
  message: string;
  link?: string | null;
}) {
  const appUrl = Deno.env.get("APP_PUBLIC_URL") || "https://entrevault.online";
  const fullLink = opts.link
    ? opts.link.startsWith("http")
      ? opts.link
      : `${appUrl}${opts.link}`
    : null;

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#0b0f0d;font-family:Arial,Helvetica,sans-serif;color:#e6f4ee;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f0d;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#111815;border:1px solid #1f3a2d;border-radius:12px;padding:28px;">
        <tr><td>
          <h1 style="margin:0 0 16px;font-size:20px;color:#10b981;">EntreVault</h1>
          <p style="margin:0 0 8px;font-size:15px;">Hi ${escapeHtml(opts.name)},</p>
          <h2 style="margin:8px 0 12px;font-size:18px;color:#ffffff;">${escapeHtml(opts.title)}</h2>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.55;color:#cfe9dd;">${escapeHtml(opts.message)}</p>
          ${
            fullLink
              ? `<p style="margin:24px 0;"><a href="${escapeHtml(fullLink)}" style="display:inline-block;background:#10b981;color:#06231a;text-decoration:none;font-weight:bold;padding:10px 18px;border-radius:8px;">Open EntreVault</a></p>`
              : ""
          }
          <hr style="border:none;border-top:1px solid #1f3a2d;margin:24px 0;" />
          <p style="margin:0;font-size:12px;color:#6b8a7d;">You are receiving this because you have an active EntreVault account.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendResendEmail(args: {
  to: string;
  subject: string;
  html: string;
  apiKey: string;
  lovableApiKey: string;
}) {
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.lovableApiKey}`,
      "X-Connection-Api-Key": args.apiKey,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [args.to],
      subject: args.subject,
      html: args.html,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const body: NotificationBody = await req.json();
    const { type, title, message, link, metadata, broadcast } = body;

    if (!type || !title || !message) {
      return new Response(
        JSON.stringify({ error: "type, title, message required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const isBroadcastType = broadcast || BROADCAST_TYPES.has(type);

    // ── Resolve recipient candidates ──────────────────────────────────────────
    let candidates: {
      user_id: string;
      email: string;
      first_name: string | null;
    }[] = [];

    if (isBroadcastType) {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, email, first_name")
        .eq("registration_status", "active");
      if (error) throw error;
      candidates = data || [];
    } else if (body.userId) {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, email, first_name")
        .eq("user_id", body.userId)
        .maybeSingle();
      if (error) throw error;
      if (data) candidates = [data];
    }

    if (candidates.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, note: "No recipients" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Ensure every candidate has an email_preferences row ──────────────────
    // New users won't have one yet because the handle_new_user DB trigger
    // doesn't create it. Upsert defaults so the join below never silently
    // drops a valid recipient.
    const prefUpserts = candidates.map((c) => ({
      user_id: c.user_id,
      transactional_enabled: true,
      broadcasts_enabled: true,
    }));
    await supabase
      .from("email_preferences")
      .upsert(prefUpserts, { onConflict: "user_id", ignoreDuplicates: true });

    // ── Fetch preferences and filter opted-out users ──────────────────────────
    const userIds = candidates.map((c) => c.user_id);
    const { data: prefs, error: prefsError } = await supabase
      .from("email_preferences")
      .select("user_id, transactional_enabled, broadcasts_enabled")
      .in("user_id", userIds);
    if (prefsError) throw prefsError;

    const prefMap = new Map(
      (prefs || []).map((p: any) => [p.user_id, p])
    );

    const prefColumn = isBroadcastType
      ? "broadcasts_enabled"
      : "transactional_enabled";

    const recipients = candidates.filter((c) => {
      const pref = prefMap.get(c.user_id);
      return pref ? pref[prefColumn] !== false : true;
    });

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, note: "All recipients opted out of email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Insert in-app notifications ───────────────────────────────────────────
    const rows = recipients.map((r) => ({
      user_id: r.user_id,
      type,
      title,
      message,
      link: link || null,
      metadata: metadata || {},
      email_sent: false,
      email_status: "pending",
    }));

    const { data: insertedRows, error: insertError } = await supabase
      .from("notifications")
      .insert(rows)
      .select("id, user_id");
    if (insertError) throw insertError;

    // Map user_id → notification id for precise per-row status updates
    const notifIdMap = new Map<string, string>(
      (insertedRows || []).map((r: any) => [r.user_id, r.id])
    );

    // ── Send emails via Resend ────────────────────────────────────────────────
    let emailsAttempted = 0;
    let emailsSent = 0;
    const emailErrors: string[] = [];

    if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
      emailErrors.push(
        "Resend connector not configured — RESEND_API_KEY and LOVABLE_API_KEY must be set."
      );
    } else {
      for (const r of recipients) {
        emailsAttempted++;
        const notifId = notifIdMap.get(r.user_id);
        try {
          const html = buildEmailHtml({
            name: r.first_name || "there",
            title,
            message,
            link,
          });
          await sendResendEmail({
            to: r.email,
            subject: title,
            html,
            apiKey: RESEND_API_KEY,
            lovableApiKey: LOVABLE_API_KEY,
          });

          if (notifId) {
            await supabase
              .from("notifications")
              .update({ email_sent: true, email_status: "sent" })
              .eq("id", notifId);
          }

          emailsSent++;
        } catch (e: any) {
          emailErrors.push(`${r.email}: ${e?.message || String(e)}`);

          if (notifId) {
            await supabase
              .from("notifications")
              .update({ email_status: "failed" })
              .eq("id", notifId);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        notifications_created: rows.length,
        emails_attempted: emailsAttempted,
        emails_sent: emailsSent,
        email_errors: emailErrors.slice(0, 5),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("send-notification error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
