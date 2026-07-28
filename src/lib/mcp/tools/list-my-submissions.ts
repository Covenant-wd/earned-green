import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failure, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_my_submissions",
  title: "List my task submissions",
  description:
    "List the signed-in user's task submissions with review status (pending, approved, rejected).",
  inputSchema: {
    status: z
      .enum(["pending", "approved", "rejected"])
      .optional()
      .describe("Filter by review status."),
    limit: z.number().int().optional().describe("Max submissions to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const take = Math.min(Math.max(limit ?? 25, 1), 100);

    let query = supabaseForUser(ctx)
      .from("task_completions")
      .select(
        "id, status, submitted_at, reviewed_at, proof_url, task_id, tasks(title, reward_amount, category)",
      )
      .eq("user_id", ctx.getUserId())
      .order("submitted_at", { ascending: false })
      .limit(take);

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return failure(error.message);
    return ok(data ?? [], { submissions: data ?? [] });
  },
});
