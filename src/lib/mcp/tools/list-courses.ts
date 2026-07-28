import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failure, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_courses",
  title: "List courses",
  description:
    "List EntreVault content creation and marketing courses available to the signed-in user.",
  inputSchema: {
    category: z.string().optional().describe("Filter by course category."),
    limit: z.number().int().optional().describe("Max courses to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const take = Math.min(Math.max(limit ?? 25, 1), 100);

    let query = supabaseForUser(ctx)
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(take);

    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) return failure(error.message);
    return ok(data ?? [], { courses: data ?? [] });
  },
});
