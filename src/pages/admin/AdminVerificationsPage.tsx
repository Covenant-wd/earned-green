import { motion } from "framer-motion";
import { Check, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockTaskCompletions, mockTasks } from "@/lib/mock-data";
import { toast } from "sonner";

export default function AdminVerificationsPage() {
  const pending = mockTaskCompletions.filter((c) => c.status === "pending");

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="page-title mb-6">Task Verifications</h1>

        {pending.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground">No pending verifications</div>
        ) : (
          <div className="space-y-3">
            {pending.map((comp) => {
              const task = mockTasks.find((t) => t.id === comp.taskId);
              return (
                <div key={comp.id} className="glass-card p-5 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-display font-semibold">{task?.title}</h3>
                    <p className="text-sm text-muted-foreground">User ID: {comp.userId} • Submitted: {comp.submittedAt}</p>
                    <a href={comp.proofUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1">
                      <ExternalLink className="h-3 w-3" /> View Proof
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-amount glow-text">${task?.rewardAmount.toFixed(2)}</span>
                    <Button size="sm" className="bg-success/10 text-success hover:bg-success/20" onClick={() => toast.success("Task approved")}>
                      <Check className="h-3 w-3 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => toast.error("Task rejected")}>
                      <X className="h-3 w-3 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
