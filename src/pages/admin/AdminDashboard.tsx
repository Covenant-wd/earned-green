import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Clock, ClipboardCheck, ArrowDownToLine, DollarSign, CheckCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ activeUsers: 0, pendingApprovals: 0, proofsToReview: 0, pendingWithdrawals: 0, earningsPaid: 0, withdrawalsCompleted: 0 });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentTx, setRecentTx] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [activeRes, pendingRes, proofsRes, withdrawPendRes, earningsRes, withdrawCompRes, usersRes, txRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }).eq("registration_status", "active"),
        supabase.from("profiles").select("id", { count: "exact" }).eq("registration_status", "pending"),
        supabase.from("task_completions").select("id", { count: "exact" }).eq("status", "pending"),
        supabase.from("transactions").select("amount").eq("type", "withdrawal").eq("status", "pending"),
        supabase.from("transactions").select("amount").eq("status", "completed").in("type", ["reward", "referral_bonus"]),
        supabase.from("transactions").select("id", { count: "exact" }).eq("type", "withdrawal").eq("status", "completed"),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({
        activeUsers: activeRes.count || 0,
        pendingApprovals: pendingRes.count || 0,
        proofsToReview: proofsRes.count || 0,
        pendingWithdrawals: (withdrawPendRes.data || []).reduce((s, t) => s + Number(t.amount), 0),
        earningsPaid: (earningsRes.data || []).reduce((s, t) => s + Number(t.amount), 0),
        withdrawalsCompleted: withdrawCompRes.count || 0,
      });
      setRecentUsers(usersRes.data || []);
      setRecentTx(txRes.data || []);
    };
    load();
  }, []);

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="page-title mb-6">Admin Overview</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard title="Active Users" value={stats.activeUsers} icon={Users} />
          <StatCard title="Pending Approvals" value={stats.pendingApprovals} icon={Clock} />
          <StatCard title="Proofs to Review" value={stats.proofsToReview} icon={ClipboardCheck} />
          <StatCard title="Pending Withdrawals" value={stats.pendingWithdrawals} icon={ArrowDownToLine} isCurrency />
          <StatCard title="Earnings Paid Out" value={stats.earningsPaid} icon={DollarSign} isCurrency />
          <StatCard title="Withdrawals Completed" value={stats.withdrawalsCompleted} icon={CheckCircle} />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass-card p-6">
            <h2 className="font-display font-semibold text-lg mb-4">Recent Registrations</h2>
            <div className="space-y-3">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{u.first_name} {u.last_name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Badge variant={u.registration_status === "active" ? "default" : "secondary"}>{u.registration_status}</Badge>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card p-6">
            <h2 className="font-display font-semibold text-lg mb-4">Recent Transactions</h2>
            <div className="space-y-3">
              {recentTx.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No transactions yet</p>
              ) : recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium capitalize">{tx.type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="font-mono-amount text-sm">${Number(tx.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
