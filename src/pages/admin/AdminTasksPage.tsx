import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Lock, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/RichTextEditor";
import { broadcastNotification } from "@/lib/notifications";
import { toast } from "sonner";

export default function AdminTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [form, setForm] = useState({ title: "", description: "", rewardAmount: "", platform: "", link: "", category: "", difficulty: "Easy", maxCompletions: "", externalCompletions: "0" });
  const [proofReqs, setProofReqs] = useState<{ label: string; type: string; required: boolean }[]>([]);

  const loadTasks = async () => {
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    setTasks(data || []);
    // Count non-rejected completions per task
    const { data: comps } = await supabase.from("task_completions").select("task_id, status");
    const c: Record<string, number> = {};
    (comps || []).forEach((row: any) => {
      if (row.status !== "rejected") c[row.task_id] = (c[row.task_id] || 0) + 1;
    });
    setCounts(c);
  };

  useEffect(() => { loadTasks(); }, []);

  const openCreate = () => {
    setEditingTask(null);
    setForm({ title: "", description: "", rewardAmount: "", platform: "", link: "", category: "", difficulty: "Easy", maxCompletions: "", externalCompletions: "0" });
    setProofReqs([{ label: "Screenshot of completed task", type: "screenshot", required: true }]);
    setDialogOpen(true);
  };
  const openEdit = (task: any) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || "",
      rewardAmount: String(task.reward_amount),
      platform: task.platform || "",
      link: task.link || "",
      category: task.category || "",
      difficulty: task.difficulty || "Easy",
      maxCompletions: task.max_completions != null ? String(task.max_completions) : "",
      externalCompletions: String(task.external_completions ?? 0),
    });
    setProofReqs(Array.isArray(task.proof_requirements) ? task.proof_requirements : []);
    setDialogOpen(true);
  };


  const handleSave = async () => {
    if (!form.title || !form.rewardAmount) { toast.error("Title and reward required"); return; }
    const maxCompletions = form.maxCompletions.trim() === "" ? null : parseInt(form.maxCompletions, 10);
    if (maxCompletions !== null && (isNaN(maxCompletions) || maxCompletions < 1)) {
      toast.error("Max submissions must be a positive number, or leave blank for unlimited");
      return;
    }
    const externalCompletions = form.externalCompletions.trim() === "" ? 0 : parseInt(form.externalCompletions, 10);
    if (isNaN(externalCompletions) || externalCompletions < 0) {
      toast.error("External submissions must be 0 or greater");
      return;
    }
    if (maxCompletions !== null && externalCompletions > maxCompletions) {
      toast.error("External submissions cannot exceed max submissions");
      return;
    }
    const cleanedReqs = proofReqs
      .map((r) => ({ label: r.label.trim(), type: r.type, required: r.required !== false }))
      .filter((r) => r.label !== "");
    const payload = {
      title: form.title,
      description: form.description,
      reward_amount: parseFloat(form.rewardAmount),
      platform: form.platform,
      link: form.link,
      category: form.category,
      difficulty: form.difficulty,
      max_completions: maxCompletions,
      external_completions: externalCompletions,
      proof_requirements: cleanedReqs,
    };
    if (editingTask) {
      const { error } = await supabase.from("tasks").update(payload).eq("id", editingTask.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Task updated");
    } else {
      const { error } = await supabase.from("tasks").insert({ ...payload, created_by: user!.id });
      if (error) { toast.error(error.message); return; }
      await broadcastNotification({
        title: `New task available: ${form.title}`,
        message: `Earn $${parseFloat(form.rewardAmount).toFixed(2)} USDT for completing "${form.title}". Head to the Tasks page to get started.`,
        link: "/tasks",
      });
      toast.success("Task created and users notified");
    }
    setDialogOpen(false);
    loadTasks();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Task deleted");
    loadTasks();
  };

  const handleToggleActive = async (task: any) => {
    const newActive = !task.is_active;
    const { error } = await supabase.from("tasks").update({ is_active: newActive }).eq("id", task.id);
    if (error) { toast.error(error.message); return; }

    // Broadcast to all active users when a task is closed
    if (!newActive) {
      await broadcastNotification({
        title: `Task closed: ${task.title}`,
        message: `The task "${task.title}" has been closed and is no longer accepting new submissions.`,
        link: "/tasks",
      });
    }

    toast.success(newActive ? "Task reopened" : "Task closed — users notified");
    loadTasks();
  };

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="page-title">Manage Tasks</h1>
          <Button className="gradient-primary text-primary-foreground" onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Create Task</Button>
        </div>
        <div className="space-y-3">
          {tasks.map((task) => {
            const onPlatform = counts[task.id] || 0;
            const external = task.external_completions || 0;
            const current = onPlatform + external;
            const max = task.max_completions;
            const pct = max ? Math.min(100, Math.round((current / max) * 100)) : 0;
            const isFull = max != null && current >= max;
            return (
              <div key={task.id} className="glass-card p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold">{task.title}</h3>
                    {task.platform && <Badge variant="secondary" className="text-xs">{task.platform}</Badge>}
                    {!task.is_active && <Badge variant="destructive" className="text-xs">Closed</Badge>}
                    {isFull && task.is_active && <Badge variant="destructive" className="text-xs">Full</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{task.description?.replace(/<[^>]+>/g, "")}</p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground font-mono">
                      {current} / {max ?? "∞"} total
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      ({onPlatform} on-platform + {external} external)
                    </span>
                    {max != null && (
                      <Progress value={pct} className="h-1.5 flex-1 max-w-[200px]" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-amount glow-text">${Number(task.reward_amount).toFixed(2)}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleToggleActive(task)}
                    title={task.is_active ? "Close task" : "Reopen task"}
                  >
                    {task.is_active ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => openEdit(task)}><Pencil className="h-3 w-3" /></Button>
                  <Button variant="outline" size="icon" onClick={() => handleDelete(task.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{editingTask ? "Edit Task" : "Create Task"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-secondary border-border" /></div>
            <div><Label>Description</Label><RichTextEditor content={form.description} onChange={(html) => setForm({ ...form, description: html })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Reward ($)</Label><Input type="number" value={form.rewardAmount} onChange={(e) => setForm({ ...form, rewardAmount: e.target.value })} className="bg-secondary border-border font-mono" /></div>
              <div><Label>Platform</Label><Input value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className="bg-secondary border-border" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-secondary border-border" /></div>
              <div><Label>Difficulty</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Easy">Easy</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Hard">Hard</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Max submissions (blank = unlimited)</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 100"
                  value={form.maxCompletions}
                  onChange={(e) => setForm({ ...form, maxCompletions: e.target.value })}
                  className="bg-secondary border-border font-mono"
                />
              </div>
              <div>
                <Label>External submissions (off-platform)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.externalCompletions}
                  onChange={(e) => setForm({ ...form, externalCompletions: e.target.value })}
                  className="bg-secondary border-border font-mono"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-1">
              Use "External submissions" to record people you hired off-platform. Slots-left for users = max − (on-platform + external). Task auto-closes when total reaches max.
            </p>
            <div><Label>Link (optional)</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="bg-secondary border-border" /></div>

            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between mb-2">
                <Label>Required proofs</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setProofReqs([...proofReqs, { label: "", type: "screenshot", required: true }])}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add proof
                </Button>
              </div>
              {proofReqs.length === 0 && (
                <p className="text-xs text-muted-foreground mb-2">No specific proofs set — users will submit a single free-form proof.</p>
              )}
              <div className="space-y-2">
                {proofReqs.map((r, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      placeholder="Proof title (e.g. Screenshot of your post)"
                      value={r.label}
                      onChange={(e) => setProofReqs(proofReqs.map((p, j) => j === i ? { ...p, label: e.target.value } : p))}
                      className="bg-secondary border-border flex-1"
                    />
                    <Select
                      value={r.type}
                      onValueChange={(v) => setProofReqs(proofReqs.map((p, j) => j === i ? { ...p, type: v } : p))}
                    >
                      <SelectTrigger className="bg-secondary border-border w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="screenshot">Screenshot</SelectItem>
                        <SelectItem value="link">Link / URL</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setProofReqs(proofReqs.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Users must supply every proof listed here before they can submit. Admins see all of them during verification.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleSave}>{editingTask ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
