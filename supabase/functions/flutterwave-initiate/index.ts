import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const purpose = body.purpose as "registration" | "deposit";
    const currency = body.currency as "NGN" | "KES";
    const usdtAmount = Number(body.usdt_amount);
    const redirectUrl = String(body.redirect_url || "");

    if (!["registration", "deposit"].includes(purpose)) {
      return new Response(JSON.stringify({ error: "Invalid purpose" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!["NGN", "KES"].includes(currency)) {
      return new Response(JSON.stringify({ error: "Invalid currency" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!usdtAmount || usdtAmount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: settings } = await admin
      .from("admin_settings")
      .select("*")
      .limit(1)
      .single();

    if (!settings?.flutterwave_enabled) {
      return new Response(
        JSON.stringify({ error: "Flutterwave payments are disabled" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // For registration, force USDT amount = registration_fee
    const finalUsdt =
      purpose === "registration" ? Number(settings.registration_fee) : usdtAmount;

    const rate =
      currency === "NGN"
        ? Number(settings.usdt_to_ngn_rate)
        : Number(settings.usdt_to_kes_rate);

    const fiatAmount = Math.round(finalUsdt * rate * 100) / 100;
    const tx_ref = `evault_${purpose}_${userData.user.id.slice(0, 8)}_${Date.now()}`;

    // Get profile email
    const { data: profile } = await admin
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("user_id", userData.user.id)
      .single();

    const flwRes = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${flwSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref,
        amount: fiatAmount,
        currency,
        redirect_url: redirectUrl,
        customer: {
          email: profile?.email || userData.user.email,
          name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
        },
        customizations: {
          title: "EntreVault",
          description:
            purpose === "registration" ? "Registration Fee" : "USDT Deposit",
        },
        meta: {
          user_id: userData.user.id,
          purpose,
          usdt_amount: finalUsdt,
        },
      }),
    });

    const flwData = await flwRes.json();
    if (flwData.status !== "success" || !flwData.data?.link) {
      console.error("Flutterwave init failed", flwData);
      return new Response(
        JSON.stringify({ error: flwData.message || "Payment init failed" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    await admin.from("payment_intents").insert({
      user_id: userData.user.id,
      purpose,
      fiat_currency: currency,
      fiat_amount: fiatAmount,
      usdt_amount: finalUsdt,
      exchange_rate: rate,
      tx_ref,
      status: "pending",
      payment_link: flwData.data.link,
    });

    return new Response(
      JSON.stringify({ payment_link: flwData.data.link, tx_ref }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("Initiate error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
