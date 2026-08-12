import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Send } from "lucide-react";
import { RichTextDisplay } from "@/components/RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

function ensureAbsoluteUrl(url: string) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return "https://" + url;
}

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [myCompletion, setMyCompletion] = useState<any>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [proofValues, setProofValues] = useState<Record<number, string>>({});
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!user || !id) return;
    const [{ data: taskData }, { data: all }, { data: mine }] = await Promise.all([
      supabase.from("tasks").select("*").eq("id", id).maybeSingle(),
      supabase.from("task_completions").select("task_id, status").eq("task_id", id),
      supabase.from("task_completions").select("*").eq("task_id", id).eq("user_id", user.id).maybeSingle(),
    ]);
    setTask(taskData);
    setCount((all || []).filter((r: any) => r.status !== "rejected").length);
    setMyCompletion(mine);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user, id]);

  const requirements: { label: string; type: string; required?: boolean }[] =
    Array.isArray(task?.proof_requirements) ? task.proof_requirements : [];

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
    if (!task || !user) return;
    let proofData: { label: string; type: string; value: string }[] = [];
    let primary = proofUrl;

    if (requirements.length > 0) {
      for (let i = 0; i < requirements.length; i++) {
        const req = requirements[i];
        const value = (proofValues[i] || "").trim();
        if (req.required !== false && !value) { toast.error(`Please provide: ${req.label}`); return; }
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
      task_id: task.id,
      proof_url: primary,
      proof_data: proofData,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Task submitted for review!");
    navigate("/tasks");
  };

  if (loading) return <div className="page-container"><p className="text-muted-foreground">Loading...</p></div>;
  if (!task) return (
    <div className="page-container">
      <Button variant="outline" onClick={() => navigate("/tasks")}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
      <p className="text-muted-foreground mt-6">Task not found</p>
    </div>
  );

  const external = task.external_completions || 0;
  const current = count + external;
  const max = task.max_completions;
  const isFull = max != null && current >= max;
  const slotsLeft = max != null ? Math.max(0, max - current) : null;
  const pct = max ? Math.min(100, Math.round((current / max) * 100)) : 0;

  return (
    <div className="page-container">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/tasks")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to tasks
      </Button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="page-title">{task.title}</h1>
          <span className="font-mono-amount glow-text text-xl">${Number(task.reward_amount).toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {task.platform && <Badge variant="secondary" className="text-xs">{task.platform}</Badge>}
          {task.category && <Badge variant="secondary" className="text-xs">{task.category}</Badge>}
          {task.difficulty && <Badge variant="secondary" className="text-xs">{task.difficulty}</Badge>}
          {max != null && (
            isFull
              ? <Badge variant="destructive" className="text-xs">Full</Badge>
              : <Badge className="text-xs bg-primary/10 text-primary">{slotsLeft} slot{slotsLeft === 1 ? "" : "s"} left</Badge>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          {task.description && task.description.startsWith("<")
            ? <RichTextDisplay content={task.description} />
            : task.description}
        </div>

        {max != null && (
          <div>
            <Progress value={pct} className="h-1.5" />
            <p className="text-xs text-muted-foreground mt-1 font-mono">{current} / {max} taken</p>
          </div>
        )}

        {task.link && (
          <Button variant="outline" size="sm" asChild>
            <a href={ensureAbsoluteUrl(task.link)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" /> Visit task link
            </a>
          </Button>
        )}
      </motion.div>

      <div className="glass-card p-6 mt-4 space-y-4">
        <h2 className="font-display font-semibold">Submit your proof</h2>

        {myCompletion ? (
          <p className="text-sm text-muted-foreground">
            You already submitted this task — status: <span className="capitalize font-medium">{myCompletion.status}</span>
          </p>
        ) : isFull ? (
          <p className="text-sm text-muted-foreground">This task is full and no longer accepting submissions.</p>
        ) : (
          <>
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
                      {proofValues[i] && <img src={proofValues[i]} alt={req.label} className="max-h-40 rounded-lg object-contain" />}
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
            <Button
              className="gradient-primary text-primary-foreground"
              disabled={submitting || uploadingIdx !== null}
              onClick={handleSubmit}
            >
              <Send className="h-3 w-3 mr-1" /> {submitting ? "Submitting..." : "Submit"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
