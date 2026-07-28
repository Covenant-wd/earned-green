import { defineTool } from "@lovable.dev/mcp-js";
import { failure, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "get_profile",
  title: "Get my profile",
  description:
    "Get the signed-in EntreVault user's profile: username, name, registration status, USDT balance, referral code and wallet address.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("profiles")
      .select(
        "username, first_name, last_name, email, country, registration_status, usdt_balance, referral_code, wallet_address, minipay_number, created_at",
      )
      .eq("user_id", ctx.getUserId())
      .maybeSingle();

    if (error) return failure(error.message);
    if (!data) return failure("No profile found for this account.");
    return ok(data, { profile: data });
  },
});
