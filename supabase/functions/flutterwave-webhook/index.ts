import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, verif-hash",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Load secrets from admin_settings (fallback to env vars)
    const { data: dbSettings } = await admin
      .from("admin_settings")
      .select("flutterwave_secret_key, flutterwave_webhook_hash")
      .limit(1)
      .single();

    const expectedHash =
      (dbSettings as any)?.flutterwave_webhook_hash ||
      Deno.env.get("FLUTTERWAVE_WEBHOOK_HASH") ||
      "";
    const flwSecret =
      (dbSettings as any)?.flutterwave_secret_key ||
      Deno.env.get("FLUTTERWAVE_SECRET_KEY") ||
      "";

    const receivedHash = req.headers.get("verif-hash");
    if (!expectedHash || receivedHash !== expectedHash) {
      console.warn("Webhook: invalid hash");
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const payload = await req.json();
    const data = payload.data || payload;
    const tx_ref = data.tx_ref;
    const flwTxId = data.id;

    if (!tx_ref || !flwTxId) {
      return new Response("Missing fields", { status: 400, headers: corsHeaders });
    }

    // Verify with Flutterwave (server-to-server) to prevent spoofing
    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${flwTxId}/verify`,
      { headers: { Authorization: `Bearer ${flwSecret}` } },
    );
    const verify = await verifyRes.json();
    const verifyData = verify.data;

    if (
      verify.status !== "success" ||
      !verifyData ||
      verifyData.status !== "successful" ||
      verifyData.tx_ref !== tx_ref
    ) {
      console.warn("Verification failed", verify);
      return new Response("Verification failed", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Lookup intent
    const { data: intent } = await admin
      .from("payment_intents")
      .select("*")
      .eq("tx_ref", tx_ref)
      .single();

    if (!intent) {
      return new Response("Intent not found", { status: 404, headers: corsHeaders });
    }

    if (intent.status === "successful") {
      return new Response("Already processed", { status: 200, headers: corsHeaders });
    }

    // Sanity: verify amount/currency match
    if (
      Number(verifyData.amount) < Number(intent.fiat_amount) ||
      verifyData.currency !== intent.fiat_currency
    ) {
      console.warn("Amount/currency mismatch", verifyData, intent);
      return new Response("Mismatch", { status: 400, headers: corsHeaders });
    }

    // Atomic: update intent first; only proceed if status flipped
    const { data: updated, error: updateErr } = await admin
      .from("payment_intents")
      .update({
        status: "successful",
        flw_tx_id: String(flwTxId),
        completed_at: new Date().toISOString(),
      })
      .eq("id", intent.id)
      .eq("status", "pending")
      .select()
      .single();

    if (updateErr || !updated) {
      return new Response("Already processed", { status: 200, headers: corsHeaders });
    }

    if (intent.purpose === "deposit") {
      // Credit USDT balance + log transaction
      const { data: prof } = await admin
        .from("profiles")
        .select("usdt_balance")
        .eq("user_id", intent.user_id)
        .single();
      const newBal = Number(prof?.usdt_balance || 0) + Number(intent.usdt_amount);
      await admin
        .from("profiles")
        .update({ usdt_balance: newBal })
        .eq("user_id", intent.user_id);

      await admin.from("transactions").insert({
        user_id: intent.user_id,
        amount: intent.usdt_amount,
        type: "deposit",
        status: "completed",
      });
    } else if (intent.purpose === "registration") {
      // Mark profile payment_proof_url as a marker so admin sees auto-paid;
      // then auto-approve via existing function
      const { data: profile } = await admin
        .from("profiles")
        .select("id, registration_status")
        .eq("user_id", intent.user_id)
        .single();

      if (profile && profile.registration_status !== "active") {
        await admin
          .from("profiles")
          .update({
            payment_proof_url: `flutterwave:${tx_ref}`,
          })
          .eq("id", profile.id);

        // Auto-activate (mirrors approve_user_registration logic without admin RPC)
        const { data: settings } = await admin
          .from("admin_settings")
          .select("registration_fee, referral_bonus_percent")
          .limit(1)
          .single();

        const { data: profFull } = await admin
          .from("profiles")
          .select("referred_by_id")
          .eq("id", profile.id)
          .single();

        await admin
          .from("profiles")
          .update({ registration_status: "active" })
          .eq("id", profile.id)
          .neq("registration_status", "active");

        if (profFull?.referred_by_id && settings) {
          const bonus =
            (Number(settings.registration_fee) *
              Number(settings.referral_bonus_percent)) /
            100;
          const { data: refProf } = await admin
            .from("profiles")
            .select("user_id, usdt_balance")
            .eq("id", profFull.referred_by_id)
            .single();
          if (refProf && bonus > 0) {
            await admin
              .from("profiles")
              .update({
                usdt_balance: Number(refProf.usdt_balance) + bonus,
              })
              .eq("id", profFull.referred_by_id);
            await admin.from("transactions").insert({
              user_id: refProf.user_id,
              amount: bonus,
              type: "referral_bonus",
              status: "completed",
            });
          }
        }
      }
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error("Webhook error", e);
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});
