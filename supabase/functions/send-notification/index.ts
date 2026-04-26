import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

// Update these to match your verified Resend sender.
// Default sender uses Resend's sandbox domain so it works without DNS setup.
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "EntreVault <support@entrevault.online>";

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

function buildEmailHtml(opts: { name: string; title: string; message: string; link?: string | null }) {
  const appUrl = Deno.env.get("APP_PUBLIC_URL") || "";
  const fullLink = opts.link
    ? (opts.link.startsWith("http") ? opts.link : `${appUrl}${opts.link}`)
    : null;

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#0b0f0d;font-family:Arial,Helvetica,sans-serif;color:#e6f4ee;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f0d;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#11181550;border:1px solid #1f3a2d;border-radius:12px;padding:28px;">
        <tr><td>
          <h1 style="margin:0 0 16px;font-size:20px;color:#10b981;">EntreVault</h1>
          <p style="margin:0 0 8px;font-size:15px;">Hi ${escapeHtml(opts.name)},</p>
          <h2 style="margin:8px 0 12px;font-size:18px;color:#ffffff;">${escapeHtml(opts.title)}</h2>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.55;color:#cfe9dd;">${escapeHtml(opts.message)}</p>
          ${fullLink ? `<p style="margin:24px 0;"><a href="${escapeHtml(fullLink)}" style="display:inline-block;background:#10b981;color:#06231a;text-decoration:none;font-weight:bold;padding:10px 18px;border-radius:8px;">Open EntreVault</a></p>` : ""}
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
  lovableKey: string;
}) {
  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.lovableKey}`,
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
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Resolve recipients
    let recipients: { user_id: string; email: string; first_name: string | null }[] = [];

    if (broadcast) {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, email, first_name")
        .eq("registration_status", "active");
      if (error) throw error;
      recipients = data || [];
    } else if (body.userId) {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, email, first_name")
        .eq("user_id", body.userId)
        .maybeSingle();
      if (error) throw error;
      if (data) recipients = [data];
    }

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, note: "No recipients" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Insert in-app notifications first (so they appear even if email fails)
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

    const { error: insertError } = await supabase.from("notifications").insert(rows);
    if (insertError) throw insertError;

    // Send emails via Resend gateway
    let emailsAttempted = 0;
    let emailsSent = 0;
    const emailErrors: string[] = [];

    if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
      emailErrors.push("Resend not configured (missing RESEND_API_KEY or LOVABLE_API_KEY)");
    } else {
      for (const r of recipients) {
        emailsAttempted++;
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
            lovableKey: LOVABLE_API_KEY,
          });
          emailsSent++;
        } catch (e: any) {
          emailErrors.push(`${r.email}: ${e?.message || String(e)}`);
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
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
