import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NEW_EMAIL = "adebayocovenant2018@gmail.com";
const NEW_PASSWORD = "adebayo1712";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find admin user via user_roles
    const { data: roleRows, error: roleErr } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (roleErr) throw roleErr;
    if (!roleRows || roleRows.length === 0) throw new Error("No admin user found");

    const results: any[] = [];
    for (const r of roleRows) {
      const { data, error } = await admin.auth.admin.updateUserById(r.user_id, {
        email: NEW_EMAIL,
        password: NEW_PASSWORD,
        email_confirm: true,
      });
      if (error) {
        results.push({ user_id: r.user_id, error: error.message });
        continue;
      }
      await admin.from("profiles").update({ email: NEW_EMAIL }).eq("user_id", r.user_id);
      results.push({ user_id: r.user_id, updated: true, email: data.user?.email });
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
