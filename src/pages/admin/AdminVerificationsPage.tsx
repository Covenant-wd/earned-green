import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, ExternalLink, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RichTextDisplay } from "@/components/RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import { sendNotification } from "@/lib/notifications";
import { toast } from "sonner";

function ensureAbsoluteUrl(url: string) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return "https://" + url;
}

export default function AdminVerificationsPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [rejected, setRejected] = useState<any[]>([]);
  const [proofDialog, setProofDialog] = useState<any>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const enrichWithProfiles = async (rows: any[]) => {
    if (!rows || rows.length === 0) return [];
    const userIds = [...new Set(rows.map((c) => c.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, email")
      .in("user_id", userIds);
    const profileMap = new Map((profilesData || []).map((p) => [p.user_id, p]));
    return rows.map((c) => ({ ...c, profile: profileMap.get(c.user_id) || null }));
  };

  const load = async () => {
    const [{ data: pendingData }, { data: rejectedData }] = await Promise.all([
      supabase.from("task_completions").select("*, tasks(*)").eq("status", "pending").order("submitted_at", { ascending: false }),
      supabase.from("task_completions").select("*, tasks(*)").eq("status", "rejected").order("reviewed_at", { ascending: false }),
    ]);
    setPending(await enrichWithProfiles(pendingData || []));
    setRejected(await enrichWithProfiles(rejectedData || []));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id: string, status: string, userId: string, rewardAmount: number) => {
    // Guard against rapid double-clicks
    if (pendingIds.has(id)) return;
    setPendingIds((s) => new Set(s).add(id));

    try {
      const completion = pending.find((c) => c.id === id);
      const taskTitle = completion?.tasks?.title || "your task submission";

      if (status === "approved") {
        // Atomic, idempotent: credits the reward exactly once
        const { data, error } = await supabase.rpc("approve_task_completion", { _completion_id: id });
        if (error) { toast.error(error.message); return; }

        const result = data as any;
        if (result?.status === "already_processed") {
          toast.info("This submission was already processed");
          setProofDialog(null);
          await load();
          return;
        }

        await sendNotification({
          userId,
          type: "task_approved",
          title: "Task approved ✅",
          message: `Your submission for "${taskTitle}" was approved. $${rewardAmount.toFixed(2)} USDT has been credited to your wallet.`,
          link: "/wallet",
        });
        toast.success("Task approved, reward credited");
      } else {
        const { data, error } = await supabase.rpc("reject_task_completion", { _completion_id: id });
        if (error) { toast.error(error.message); return; }

        const result = data as any;
        if (result?.status === "already_processed") {
          toast.info("This submission was already processed");
          setProofDialog(null);
          await load();
          return;
        }

        await sendNotification({
          userId,
          type: "task_rejected",
          title: "Task submission rejected",
          message: `Your submission for "${taskTitle}" was not approved. Please review the requirements and try again.`,
          link: "/tasks",
        });
        toast.error("Task rejected");
      }
      setProofDialog(null);
      await load();
    } finally {
      setPendingIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  };

  const handleAllowRetry = async (comp: any) => {
    if (pendingIds.has(comp.id)) return;
    setPendingIds((s) => new Set(s).add(comp.id));
    try {
      const { error } = await supabase.from("task_completions").delete().eq("id", comp.id);
      if (error) { toast.error(error.message); return; }
      await sendNotification({
        userId: comp.user_id,
        type: "task_retry_allowed",
        title: "You can retry a task 🔄",
        message: `An admin has allowed you to resubmit "${comp.tasks?.title}". Head to the Tasks page to try again.`,
        link: "/tasks",
      });
      toast.success("Retry allowed — user can resubmit");
      await load();
    } finally {
      setPendingIds((s) => {
        const next = new Set(s);
        next.delete(comp.id);
        return next;
      });
    }
  };

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="page-title mb-6">Task Verifications</h1>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="glass-card mb-6">
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pending.length === 0 ? (
              <div className="glass-card p-8 text-center text-muted-foreground">No pending verifications</div>
            ) : (
              <div className="space-y-3">
                {pending.map((comp) => (
                  <div key={comp.id} className="glass-card p-5 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold">{comp.tasks?.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {comp.profile?.first_name} {comp.profile?.last_name} ({comp.profile?.email}) • {new Date(comp.submitted_at).toLocaleDateString()}
                      </p>
                      {comp.tasks?.link && (
                        <a href={ensureAbsoluteUrl(comp.tasks.link)} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1">
                          <ExternalLink className="h-3 w-3" /> Task Link
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-amount glow-text">${Number(comp.tasks?.reward_amount).toFixed(2)}</span>
                      <Button size="sm" variant="outline" onClick={() => setProofDialog(comp)}>
                        <Eye className="h-3 w-3 mr-1" /> View Proof
                      </Button>
                      <Button size="sm" disabled={pendingIds.has(comp.id)} className="bg-success/10 text-success hover:bg-success/20" onClick={() => handleAction(comp.id, "approved", comp.user_id, Number(comp.tasks?.reward_amount))}>
                        <Check className="h-3 w-3 mr-1" /> {pendingIds.has(comp.id) ? "Processing..." : "Approve"}
                      </Button>
                      <Button size="sm" disabled={pendingIds.has(comp.id)} variant="destructive" onClick={() => handleAction(comp.id, "rejected", comp.user_id, 0)}>
                        <X className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected">
            {rejected.length === 0 ? (
              <div className="glass-card p-8 text-center text-muted-foreground">No rejected submissions</div>
            ) : (
              <div className="space-y-3">
                {rejected.map((comp) => (
                  <div key={comp.id} className="glass-card p-5 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold">{comp.tasks?.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {comp.profile?.first_name} {comp.profile?.last_name} ({comp.profile?.email})
                        {comp.reviewed_at && <> • rejected {new Date(comp.reviewed_at).toLocaleDateString()}</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setProofDialog(comp)}>
                        <Eye className="h-3 w-3 mr-1" /> View Proof
                      </Button>
                      <Button
                        size="sm"
                        disabled={pendingIds.has(comp.id)}
                        className="bg-primary/10 text-primary hover:bg-primary/20"
                        onClick={() => handleAllowRetry(comp)}
                        title="Clears the rejection so the user can submit this task again"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" /> {pendingIds.has(comp.id) ? "Processing..." : "Allow Retry"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      <Dialog open={!!proofDialog} onOpenChange={() => setProofDialog(null)}>
        <DialogContent className="glass-card border-border max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">Proof Details</DialogTitle></DialogHeader>
          {proofDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Task</p>
                  <p className="font-semibold">{proofDialog.tasks?.title}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reward</p>
                  <p className="font-mono-amount glow-text">${Number(proofDialog.tasks?.reward_amount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Submitted by</p>
                  <p>{proofDialog.profile?.first_name} {proofDialog.profile?.last_name}</p>
                  <p className="text-xs text-muted-foreground">{proofDialog.profile?.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p>{new Date(proofDialog.submitted_at).toLocaleString()}</p>
                </div>
              </div>

              {proofDialog.tasks?.description && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Task Description</p>
                  <div className="bg-secondary/50 rounded-lg p-3 text-sm">
                    {proofDialog.tasks.description.startsWith("<") ? <RichTextDisplay content={proofDialog.tasks.description} /> : proofDialog.tasks.description}
                  </div>
                </div>
              )}

              {Array.isArray(proofDialog.proof_data) && proofDialog.proof_data.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-sm">Proofs Submitted ({proofDialog.proof_data.length})</p>
                  {proofDialog.proof_data.map((p: any, i: number) => (
                    <div key={i} className="bg-secondary/50 rounded-lg p-3 space-y-2">
                      <p className="text-xs text-muted-foreground">{p.label}</p>
                      {!p.value ? (
                        <p className="text-sm italic text-muted-foreground">Not provided</p>
                      ) : String(p.value).startsWith("http") ? (
                        <div className="space-y-2">
                          <a href={ensureAbsoluteUrl(p.value)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 break-all text-sm">
                            <ExternalLink className="h-4 w-4 shrink-0" /> {p.value}
                          </a>
                          {(p.type === "screenshot" || String(p.value).match(/\.(jpg|jpeg|png|gif|webp)$/i)) && (
                            <img src={ensureAbsoluteUrl(p.value)} alt={p.label} className="w-full max-h-96 object-contain rounded-lg" />
                          )}
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-all">{p.value}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
              <div>
                <p className="text-muted-foreground text-sm mb-1">Proof Submitted</p>
                <div className="bg-secondary/50 rounded-lg p-4">
                  {proofDialog.proof_url && (proofDialog.proof_url.startsWith("http") || proofDialog.proof_url.startsWith("www")) ? (
                    <div className="space-y-2">
                      <a href={ensureAbsoluteUrl(proofDialog.proof_url)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 break-all">
                        <ExternalLink className="h-4 w-4 shrink-0" /> {proofDialog.proof_url}
                      </a>
                      {(proofDialog.proof_url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) && (
                        <img src={ensureAbsoluteUrl(proofDialog.proof_url)} alt="Proof" className="w-full max-h-96 object-contain rounded-lg mt-2" />
                      )}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-all">{proofDialog.proof_url || "No proof provided"}</p>
                  )}
                </div>
              </div>
              )}

              {proofDialog.tasks?.link && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Task Link</p>
                  <a href={ensureAbsoluteUrl(proofDialog.tasks.link)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                    <ExternalLink className="h-4 w-4" /> {proofDialog.tasks.link}
                  </a>
                </div>
              )}

              {proofDialog.status === "pending" ? (
                <div className="flex justify-end gap-2 pt-2">
                  <Button size="sm" disabled={pendingIds.has(proofDialog.id)} className="bg-success/10 text-success hover:bg-success/20" onClick={() => handleAction(proofDialog.id, "approved", proofDialog.user_id, Number(proofDialog.tasks?.reward_amount))}>
                    <Check className="h-3 w-3 mr-1" /> {pendingIds.has(proofDialog.id) ? "Processing..." : "Approve"}
                  </Button>
                  <Button size="sm" disabled={pendingIds.has(proofDialog.id)} variant="destructive" onClick={() => handleAction(proofDialog.id, "rejected", proofDialog.user_id, 0)}>
                    <X className="h-3 w-3 mr-1" /> Reject
                  </Button>
                </div>
              ) : proofDialog.status === "rejected" ? (
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    disabled={pendingIds.has(proofDialog.id)}
                    className="bg-primary/10 text-primary hover:bg-primary/20"
                    onClick={() => { handleAllowRetry(proofDialog); setProofDialog(null); }}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" /> {pendingIds.has(proofDialog.id) ? "Processing..." : "Allow Retry"}
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
