import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Send } from "lucide-react";
import { RichTextDisplay } from "@/components/RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function ensureAbsoluteUrl(url: string) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return "https://" + url;
}

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [proofUrl, setProofUrl] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("tasks").select("*").eq("is_active", true).then(({ data }) => setTasks(data || []));
    supabase.from("task_completions").select("*, tasks(*)").eq("user_id", user.id).then(({ data }) => setCompletions(data || []));
  }, [user]);

  const completedTaskIds = completions.map((c) => c.task_id);
  const availableTasks = tasks.filter((t) => !completedTaskIds.includes(t.id));
  const pendingCompletions = completions.filter((c) => c.status === "pending");
  const approvedCompletions = completions.filter((c) => c.status === "approved");
  const rejectedCompletions = completions.filter((c) => c.status === "rejected");

  const handleSubmit = async () => {
    if (!proofUrl || !selectedTask || !user) { toast.error("Please provide proof"); return; }
    const { error } = await supabase.from("task_completions").insert({
      user_id: user.id,
      task_id: selectedTask.id,
      proof_url: proofUrl,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Task submitted for review!");
    setSubmitDialogOpen(false);
    setProofUrl("");
    // Refresh
    const { data } = await supabase.from("task_completions").select("*, tasks(*)").eq("user_id", user.id);
    setCompletions(data || []);
  };

  const difficultyColor = (d: string) => {
    if (d === "Easy") return "bg-success/10 text-success";
    if (d === "Medium") return "bg-warning/10 text-warning";
    return "bg-destructive/10 text-destructive";
  };

  const TaskCard = ({ task }: { task: any }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card-hover p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display font-semibold">{task.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{task.description && task.description.startsWith("<") ? <RichTextDisplay content={task.description} /> : task.description}</p>
        </div>
        <span className="font-mono-amount glow-text text-lg">${Number(task.reward_amount).toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {task.platform && <Badge variant="secondary" className="text-xs">{task.platform}</Badge>}
        {task.category && <Badge variant="secondary" className="text-xs">{task.category}</Badge>}
        {task.difficulty && <Badge className={`text-xs ${difficultyColor(task.difficulty)}`}>{task.difficulty}</Badge>}
      </div>
      <div className="flex gap-2">
        {task.link && (
          <Button variant="outline" size="sm" asChild>
            <a href={task.link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1" /> Visit</a>
          </Button>
        )}
        <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => { setSelectedTask(task); setSubmitDialogOpen(true); }}>
          <Send className="h-3 w-3 mr-1" /> Submit Proof
        </Button>
      </div>
    </motion.div>
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
          <div className="grid gap-4 md:grid-cols-2">
            {availableTasks.map((task) => <TaskCard key={task.id} task={task} />)}
            {availableTasks.length === 0 && <p className="text-muted-foreground text-center py-8 col-span-2">No available tasks</p>}
          </div>
        </TabsContent>
        <TabsContent value="pending">
          {pendingCompletions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No pending submissions</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingCompletions.map((c) => (
                <div key={c.id} className="glass-card p-5">
                  <h3 className="font-display font-semibold">{c.tasks?.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Submitted: {new Date(c.submitted_at).toLocaleDateString()}</p>
                  <Badge variant="secondary" className="mt-2">Pending Review</Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="completed">
          {approvedCompletions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No completed tasks</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {approvedCompletions.map((c) => (
                <div key={c.id} className="glass-card p-5">
                  <h3 className="font-display font-semibold">{c.tasks?.title}</h3>
                  <span className="font-mono-amount glow-text">${Number(c.tasks?.reward_amount).toFixed(2)}</span>
                  <Badge className="ml-2 bg-success/10 text-success">Approved</Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="rejected">
          {rejectedCompletions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No rejected submissions</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {rejectedCompletions.map((c) => (
                <div key={c.id} className="glass-card p-5">
                  <h3 className="font-display font-semibold">{c.tasks?.title}</h3>
                  <Badge variant="destructive" className="mt-2">Rejected</Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader><DialogTitle className="font-display">Submit Proof — {selectedTask?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Proof URL or description</Label>
            <Input value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} placeholder="https://twitter.com/yourpost..." className="bg-secondary border-border" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
