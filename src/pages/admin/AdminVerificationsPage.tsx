import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, ExternalLink, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RichTextDisplay } from "@/components/RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function ensureAbsoluteUrl(url: string) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return "https://" + url;
}

export default function AdminVerificationsPage() {
  const [completions, setCompletions] = useState<any[]>([]);
  const [proofDialog, setProofDialog] = useState<any>(null);

  const load = async () => {
    const { data: completionsData } = await supabase
      .from("task_completions")
      .select("*, tasks(*)")
      .eq("status", "pending")
      .order("submitted_at", { ascending: false });

    if (!completionsData || completionsData.length === 0) {
      setCompletions([]);
      return;
    }

    const userIds = [...new Set(completionsData.map((c) => c.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, email")
      .in("user_id", userIds);

    const profileMap = new Map((profilesData || []).map((p) => [p.user_id, p]));
    const enriched = completionsData.map((c) => ({ ...c, profile: profileMap.get(c.user_id) || null }));
    setCompletions(enriched);
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id: string, status: string, userId: string, rewardAmount: number) => {
    const { error } = await supabase.from("task_completions").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }

    if (status === "approved") {
      const { data: profile } = await supabase.from("profiles").select("usdt_balance").eq("user_id", userId).single();
      if (profile) {
        await supabase.from("profiles").update({ usdt_balance: Number(profile.usdt_balance) + rewardAmount }).eq("user_id", userId);
        await supabase.from("transactions").insert({ user_id: userId, amount: rewardAmount, type: "reward", status: "completed" });
      }
      toast.success("Task approved, reward credited");
    } else {
      toast.error("Task rejected");
    }
    setProofDialog(null);
    load();
  };

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="page-title mb-6">Task Verifications</h1>
        {completions.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground">No pending verifications</div>
        ) : (
          <div className="space-y-3">
            {completions.map((comp) => (
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
                  <Button size="sm" className="bg-success/10 text-success hover:bg-success/20" onClick={() => handleAction(comp.id, "approved", comp.user_id, Number(comp.tasks?.reward_amount))}>
                    <Check className="h-3 w-3 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleAction(comp.id, "rejected", comp.user_id, 0)}>
                    <X className="h-3 w-3 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
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

              {proofDialog.tasks?.link && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Task Link</p>
                  <a href={ensureAbsoluteUrl(proofDialog.tasks.link)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                    <ExternalLink className="h-4 w-4" /> {proofDialog.tasks.link}
                  </a>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button size="sm" className="bg-success/10 text-success hover:bg-success/20" onClick={() => handleAction(proofDialog.id, "approved", proofDialog.user_id, Number(proofDialog.tasks?.reward_amount))}>
                  <Check className="h-3 w-3 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleAction(proofDialog.id, "rejected", proofDialog.user_id, 0)}>
                  <X className="h-3 w-3 mr-1" /> Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
