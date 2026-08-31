import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failure, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_sessions",
  title: "List live classes",
  description:
    "List EntreVault live classes the signed-in user can access, newest upcoming first.",
  inputSchema: {
    course_id: z.string().uuid().optional().describe("Filter by course id."),
    include_past: z.boolean().optional().describe("Include sessions that already ended."),
    limit: z.number().int().optional().describe("Max sessions to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ course_id, include_past, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const take = Math.min(Math.max(limit ?? 25, 1), 100);

    let query = supabaseForUser(ctx)
      .from("live_sessions")
      .select("id, title, description, course_id, starts_at, duration_minutes, status, timezone")
      .order("starts_at", { ascending: true })
      .limit(take);

    if (course_id) query = query.eq("course_id", course_id);
    if (!include_past) query = query.gte("starts_at", new Date(Date.now() - 3 * 3600_000).toISOString());

    const { data, error } = await query;
    if (error) return failure(error.message);
    return ok(data ?? [], { sessions: data ?? [] });
  },
});
