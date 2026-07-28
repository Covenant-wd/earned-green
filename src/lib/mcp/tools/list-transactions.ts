import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failure, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_transactions",
  title: "List my transactions",
  description:
    "List the signed-in user's USDT wallet transactions (deposits, withdrawals, rewards, referral bonuses).",
  inputSchema: {
    type: z.string().optional().describe("Filter by transaction type, e.g. deposit or withdrawal."),
    limit: z.number().int().optional().describe("Max transactions to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ type, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const take = Math.min(Math.max(limit ?? 25, 1), 100);

    let query = supabaseForUser(ctx)
      .from("transactions")
      .select("id, type, amount, status, tx_hash, wallet_address, created_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(take);

    if (type) query = query.eq("type", type);

    const { data, error } = await query;
    if (error) return failure(error.message);
    return ok(data ?? [], { transactions: data ?? [] });
  },
});
