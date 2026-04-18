import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationBody {
  userId?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
  broadcast?: boolean;
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

    // Insert in-app notifications
    const rows = recipients.map((r) => ({
      user_id: r.user_id,
      type,
      title,
      message,
      link: link || null,
      metadata: metadata || {},
      email_sent: false,
      email_status: "pending_domain_setup",
    }));

    const { error: insertError } = await supabase.from("notifications").insert(rows);
    if (insertError) throw insertError;

    // Try to forward to send-transactional-email if it's available.
    // Until a sender domain is configured this will no-op; we still log status.
    let emailsAttempted = 0;
    let emailsSent = 0;
    let emailErrors: string[] = [];

    for (const r of recipients) {
      emailsAttempted++;
      try {
        const { error: emailErr } = await supabase.functions.invoke(
          "send-transactional-email",
          {
            body: {
              templateName: "general-notification",
              recipientEmail: r.email,
              idempotencyKey: `${type}-${r.user_id}-${Date.now()}`,
              templateData: {
                name: r.first_name || "there",
                title,
                message,
                link: link || null,
              },
            },
          },
        );
        if (emailErr) {
          emailErrors.push(emailErr.message || String(emailErr));
        } else {
          emailsSent++;
        }
      } catch (e: any) {
        // Edge function not deployed yet (no domain configured) — silent skip
        emailErrors.push(e?.message || String(e));
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        notifications_created: rows.length,
        emails_attempted: emailsAttempted,
        emails_sent: emailsSent,
        email_errors: emailErrors.slice(0, 3),
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
