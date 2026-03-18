import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminVerificationsPage() {
  const [completions, setCompletions] = useState<any[]>([]);

  const load = async () => {
    // First get pending completions with task info
    const { data: completionsData } = await supabase
      .from("task_completions")
      .select("*, tasks(*)")
      .eq("status", "pending")
      .order("submitted_at", { ascending: false });

    if (!completionsData || completionsData.length === 0) {
      setCompletions([]);
      return;
    }

    // Fetch profiles for the user_ids
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
      // Credit user balance and create transaction
      const { data: profile } = await supabase.from("profiles").select("usdt_balance").eq("user_id", userId).single();
      if (profile) {
        await supabase.from("profiles").update({ usdt_balance: Number(profile.usdt_balance) + rewardAmount }).eq("user_id", userId);
        await supabase.from("transactions").insert({ user_id: userId, amount: rewardAmount, type: "reward", status: "completed" });
      }
      toast.success("Task approved, reward credited");
    } else {
      toast.error("Task rejected");
    }
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
                <div>
                  <h3 className="font-display font-semibold">{comp.tasks?.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {comp.profile?.first_name} {comp.profile?.last_name} ({comp.profile?.email}) • {new Date(comp.submitted_at).toLocaleDateString()}
                  </p>
                  {comp.proof_url && (
                    <a href={comp.proof_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1">
                      <ExternalLink className="h-3 w-3" /> View Proof
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-amount glow-text">${Number(comp.tasks?.reward_amount).toFixed(2)}</span>
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
    </div>
  );
}
