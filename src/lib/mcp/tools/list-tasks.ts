import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failure, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_tasks",
  title: "List tasks",
  description:
    "List EntreVault earning tasks with reward amount, capacity and remaining slots. Defaults to open tasks only.",
  inputSchema: {
    include_closed: z
      .boolean()
      .optional()
      .describe("Include tasks that are closed or full. Defaults to false."),
    limit: z.number().int().optional().describe("Max tasks to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ include_closed, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    const take = Math.min(Math.max(limit ?? 25, 1), 100);

    let query = supabase
      .from("tasks")
      .select(
        "id, title, description, category, platform, type, difficulty, link, reward_amount, max_completions, external_completions, is_active, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(take);

    if (!include_closed) query = query.eq("is_active", true);

    const { data, error } = await query;
    if (error) return failure(error.message);

    const ids = (data ?? []).map((t) => t.id);
    const counts = new Map<string, number>();
    if (ids.length) {
      const { data: completions } = await supabase
        .from("task_completions")
        .select("task_id")
        .in("task_id", ids)
        .neq("status", "rejected");
      for (const row of completions ?? []) {
        counts.set(row.task_id, (counts.get(row.task_id) ?? 0) + 1);
      }
    }

    const tasks = (data ?? []).map((t) => {
      const submitted = (counts.get(t.id) ?? 0) + (t.external_completions ?? 0);
      const slotsLeft =
        t.max_completions == null ? null : Math.max(t.max_completions - submitted, 0);
      return { ...t, submitted_count: submitted, slots_left: slotsLeft, is_full: slotsLeft === 0 };
    });

    const visible = include_closed ? tasks : tasks.filter((t) => !t.is_full);
    return ok(visible, { tasks: visible });
  },
});
