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
import { Progress } from "@/components/ui/progress";
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
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [proofValues, setProofValues] = useState<Record<number, string>>({});
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const requirements: { label: string; type: string; required?: boolean }[] =
    Array.isArray(selectedTask?.proof_requirements) ? selectedTask.proof_requirements : [];

  const openSubmit = (task: any) => {
    setSelectedTask(task);
    setProofUrl("");
    setProofValues({});
    setSubmitDialogOpen(true);
  };

  const uploadProofFile = async (file: File, idx: number) => {
    if (!user) return;
    setUploadingIdx(idx);
    const filePath = `${user.id}/task-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("payment-proofs").upload(filePath, file);
    if (error) { toast.error("Upload failed: " + error.message); setUploadingIdx(null); return; }
    const { data: { publicUrl } } = supabase.storage.from("payment-proofs").getPublicUrl(filePath);
    setProofValues((prev) => ({ ...prev, [idx]: publicUrl }));
    setUploadingIdx(null);
    toast.success("Uploaded");
  };

  const handleSubmit = async () => {
    if (!selectedTask || !user) return;

    let proofData: { label: string; type: string; value: string }[] = [];
    let primary = proofUrl;

    if (requirements.length > 0) {
      for (let i = 0; i < requirements.length; i++) {
        const req = requirements[i];
        const value = (proofValues[i] || "").trim();
        if (req.required !== false && !value) {
          toast.error(`Please provide: ${req.label}`);
          return;
        }
        proofData.push({ label: req.label, type: req.type, value });
      }
      primary = proofData.find((p) => p.value)?.value || "";
    } else if (!proofUrl.trim()) {
      toast.error("Please provide proof");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("task_completions").insert({
      user_id: user.id,
      task_id: selectedTask.id,
      proof_url: primary,
      proof_data: proofData,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Task submitted for review!");
    setSubmitDialogOpen(false);
    setProofUrl("");
    setProofValues({});
    loadAll();
  };


  const difficultyColor = (d: string) => {
    if (d === "Easy") return "bg-success/10 text-success";
    if (d === "Medium") return "bg-warning/10 text-warning";
    return "bg-destructive/10 text-destructive";
  };

  const TaskCard = ({ task }: { task: any }) => {
    const onPlatform = taskCounts[task.id] || 0;
    const external = task.external_completions || 0;
    const current = onPlatform + external;
    const max = task.max_completions;
    const isFull = max != null && current >= max;
    const slotsLeft = max != null ? Math.max(0, max - current) : null;
    const pct = max ? Math.min(100, Math.round((current / max) * 100)) : 0;

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card-hover p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-display font-semibold">{task.title}</h3>
            <div className="text-sm text-muted-foreground mt-1">{task.description && task.description.startsWith("<") ? <RichTextDisplay content={task.description} /> : task.description}</div>
          </div>
          <span className="font-mono-amount glow-text text-lg">${Number(task.reward_amount).toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {task.platform && <Badge variant="secondary" className="text-xs">{task.platform}</Badge>}
          {task.category && <Badge variant="secondary" className="text-xs">{task.category}</Badge>}
          {task.difficulty && <Badge className={`text-xs ${difficultyColor(task.difficulty)}`}>{task.difficulty}</Badge>}
          {max != null && (
            isFull
              ? <Badge variant="destructive" className="text-xs">Full</Badge>
              : <Badge className="text-xs bg-primary/10 text-primary">{slotsLeft} slot{slotsLeft === 1 ? "" : "s"} left</Badge>
          )}
        </div>
        {max != null && (
          <div className="mb-3">
            <Progress value={pct} className="h-1.5" />
            <p className="text-xs text-muted-foreground mt-1 font-mono">{current} / {max} taken</p>
          </div>
        )}
        <div className="flex gap-2">
          {task.link && (
            <Button variant="outline" size="sm" asChild>
              <a href={ensureAbsoluteUrl(task.link)} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1" /> Visit</a>
            </Button>
          )}
          <Button
            size="sm"
            className="gradient-primary text-primary-foreground"
            disabled={isFull}
            title={isFull ? "Task is full" : undefined}
            onClick={() => openSubmit(task)}
          >
            <Send className="h-3 w-3 mr-1" /> {isFull ? "Task Full" : "Submit Proof"}
          </Button>
        </div>
      </motion.div>
    );
  };

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
        <DialogContent className="glass-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Submit Proof — {selectedTask?.title}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {requirements.length === 0 ? (
              <div className="space-y-2">
                <Label>Proof URL or description</Label>
                <Input value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} placeholder="https://twitter.com/yourpost..." className="bg-background" />
              </div>
            ) : (
              requirements.map((req, i) => (
                <div key={i} className="space-y-2">
                  <Label>
                    {req.label} {req.required === false && <span className="text-xs text-muted-foreground">(optional)</span>}
                  </Label>
                  {req.type === "screenshot" ? (
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        disabled={uploadingIdx !== null}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProofFile(f, i); }}
                        className="bg-background"
                      />
                      {uploadingIdx === i && <p className="text-xs text-muted-foreground">Uploading...</p>}
                      {proofValues[i] && (
                        <img src={proofValues[i]} alt={req.label} className="max-h-40 rounded-lg object-contain" />
                      )}
                    </div>
                  ) : (
                    <Input
                      value={proofValues[i] || ""}
                      onChange={(e) => setProofValues({ ...proofValues, [i]: e.target.value })}
                      placeholder={req.type === "link" ? "https://..." : "Type your answer"}
                      className="bg-background"
                    />
                  )}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" disabled={submitting || uploadingIdx !== null} onClick={handleSubmit}>{submitting ? "Submitting..." : "Submit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
