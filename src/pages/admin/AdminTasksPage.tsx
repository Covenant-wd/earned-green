import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function AdminTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [form, setForm] = useState({ title: "", description: "", rewardAmount: "", platform: "", link: "", category: "", difficulty: "Easy" });

  const loadTasks = async () => {
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    setTasks(data || []);
  };

  useEffect(() => { loadTasks(); }, []);

  const openCreate = () => { setEditingTask(null); setForm({ title: "", description: "", rewardAmount: "", platform: "", link: "", category: "", difficulty: "Easy" }); setDialogOpen(true); };
  const openEdit = (task: any) => {
    setEditingTask(task);
    setForm({ title: task.title, description: task.description || "", rewardAmount: String(task.reward_amount), platform: task.platform || "", link: task.link || "", category: task.category || "", difficulty: task.difficulty || "Easy" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.rewardAmount) { toast.error("Title and reward required"); return; }
    if (editingTask) {
      const { error } = await supabase.from("tasks").update({ title: form.title, description: form.description, reward_amount: parseFloat(form.rewardAmount), platform: form.platform, link: form.link, category: form.category, difficulty: form.difficulty }).eq("id", editingTask.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Task updated");
    } else {
      const { error } = await supabase.from("tasks").insert({ title: form.title, description: form.description, reward_amount: parseFloat(form.rewardAmount), platform: form.platform, link: form.link, category: form.category, difficulty: form.difficulty, created_by: user!.id });
      if (error) { toast.error(error.message); return; }
      toast.success("Task created");
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

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="page-title">Manage Tasks</h1>
          <Button className="gradient-primary text-primary-foreground" onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Create Task</Button>
        </div>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="glass-card p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold">{task.title}</h3>
                  {task.platform && <Badge variant="secondary" className="text-xs">{task.platform}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground truncate">{task.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono-amount glow-text">${Number(task.reward_amount).toFixed(2)}</span>
                <Button variant="outline" size="icon" onClick={() => openEdit(task)}><Pencil className="h-3 w-3" /></Button>
                <Button variant="outline" size="icon" onClick={() => handleDelete(task.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader><DialogTitle className="font-display">{editingTask ? "Edit Task" : "Create Task"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-secondary border-border" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border" /></div>
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
            <div><Label>Link (optional)</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="bg-secondary border-border" /></div>
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
