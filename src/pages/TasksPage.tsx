import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});

  const loadAll = async () => {
    if (!user) return;
    const [{ data: tasksData }, { data: completionsData }, { data: allCompletions }] = await Promise.all([
      supabase.from("tasks").select("*").eq("is_active", true),
      supabase.from("task_completions").select("*, tasks(*)").eq("user_id", user.id),
      supabase.from("task_completions").select("task_id, status"),
    ]);
    setTasks(tasksData || []);
    setCompletions(completionsData || []);
    const counts: Record<string, number> = {};
    (allCompletions || []).forEach((row: any) => {
      if (row.status !== "rejected") counts[row.task_id] = (counts[row.task_id] || 0) + 1;
    });
    setTaskCounts(counts);
  };

  useEffect(() => { loadAll(); }, [user]);

  const completedTaskIds = completions.map((c) => c.task_id);
  const availableTasks = tasks.filter((t) => !completedTaskIds.includes(t.id));
  const pendingCompletions = completions.filter((c) => c.status === "pending");
  const approvedCompletions = completions.filter((c) => c.status === "approved");
  const rejectedCompletions = completions.filter((c) => c.status === "rejected");

  const TaskRow = ({ task }: { task: any }) => {
    const current = (taskCounts[task.id] || 0) + (task.external_completions || 0);
    const max = task.max_completions;
    const isFull = max != null && current >= max;
    const slotsLeft = max != null ? Math.max(0, max - current) : null;

    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          to={`/tasks/${task.id}`}
          className="glass-card-hover flex items-center justify-between gap-3 p-4"
        >
          <div className="min-w-0">
            <h3 className="font-display font-semibold truncate">{task.title}</h3>
            {max != null && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {isFull ? "Full" : `${slotsLeft} slot${slotsLeft === 1 ? "" : "s"} left`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono-amount glow-text">${Number(task.reward_amount).toFixed(2)}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>
      </motion.div>
    );
  };

  const CompletionRow = ({ c, badge }: { c: any; badge: React.ReactNode }) => (
    <Link to={`/tasks/${c.task_id}`} className="glass-card-hover flex items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <h3 className="font-display font-semibold truncate">{c.tasks?.title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {c.submitted_at ? new Date(c.submitted_at).toLocaleDateString() : ""}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {c.tasks?.reward_amount != null && (
          <span className="font-mono-amount glow-text">${Number(c.tasks.reward_amount).toFixed(2)}</span>
        )}
        {badge}
      </div>
    </Link>
  );

  return (
    <div className="page-container">
      <h1 className="page-title mb-6">Tasks</h1>
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="glass-card mb-6">
          <TabsTrigger value="available">Available ({availableTasks.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingCompletions.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({approvedCompletions.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedCompletions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <div className="grid gap-3 md:grid-cols-2">
            {availableTasks.map((task) => <TaskRow key={task.id} task={task} />)}
            {availableTasks.length === 0 && <p className="text-muted-foreground text-center py-8 col-span-2">No available tasks</p>}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          {pendingCompletions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No pending submissions</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {pendingCompletions.map((c) => (
                <CompletionRow key={c.id} c={c} badge={<Badge variant="secondary">Pending</Badge>} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {approvedCompletions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No completed tasks</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {approvedCompletions.map((c) => (
                <CompletionRow key={c.id} c={c} badge={<Badge className="bg-success/10 text-success">Approved</Badge>} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected">
          {rejectedCompletions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No rejected submissions</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {rejectedCompletions.map((c) => (
                <CompletionRow key={c.id} c={c} badge={<Badge variant="destructive">Rejected</Badge>} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
