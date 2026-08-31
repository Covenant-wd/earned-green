import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failure, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_my_enrollments",
  title: "List my enrollments",
  description: "List the signed-in user's course enrollments and their access status.",
  inputSchema: {
    limit: z.number().int().optional().describe("Max enrollments to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const take = Math.min(Math.max(limit ?? 25, 1), 100);

    const { data, error } = await supabaseForUser(ctx)
      .from("enrollments")
      .select("id, course_id, status, enrolled_at, access_expires_at, courses(title, slug, level)")
      .eq("user_id", ctx.getUserId())
      .order("enrolled_at", { ascending: false })
      .limit(take);

    if (error) return failure(error.message);
    return ok(data ?? [], { enrollments: data ?? [] });
  },
});
