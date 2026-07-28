import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failure, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_notifications",
  title: "List my notifications",
  description: "List the signed-in user's in-app EntreVault notifications, newest first.",
  inputSchema: {
    unread_only: z.boolean().optional().describe("Only return unread notifications."),
    limit: z.number().int().optional().describe("Max notifications to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ unread_only, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const take = Math.min(Math.max(limit ?? 20, 1), 100);

    let query = supabaseForUser(ctx)
      .from("notifications")
      .select("id, type, title, message, link, read, created_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(take);

    if (unread_only) query = query.eq("read", false);

    const { data, error } = await query;
    if (error) return failure(error.message);
    return ok(data ?? [], { notifications: data ?? [] });
  },
});
