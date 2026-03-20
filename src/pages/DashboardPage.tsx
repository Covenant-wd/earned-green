import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Users, ListChecks, Clock, AlertTriangle, Upload } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DashboardPage() {
  const { profile, user, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [taskStats, setTaskStats] = useState({ active: 0, pending: 0 });
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Fetch transactions
    supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5).then(({ data }) => setTransactions(data || []));
    // Fetch settings
    supabase.from("admin_settings").select("*").limit(1).single().then(({ data }) => setSettings(data));
    // Fetch task stats
    supabase.from("tasks").select("id", { count: "exact" }).eq("is_active", true).then(({ count }) => setTaskStats((prev) => ({ ...prev, active: count || 0 })));
    supabase.from("task_completions").select("id", { count: "exact" }).eq("user_id", user.id).eq("status", "pending").then(({ count }) => setTaskStats((prev) => ({ ...prev, pending: count || 0 })));
    // Fetch referral earnings
    supabase.from("transactions").select("amount").eq("user_id", user.id).eq("type", "referral_bonus").eq("status", "completed").then(({ data }) => {
      const total = (data || []).reduce((sum, tx) => sum + Number(tx.amount), 0);
      setReferralEarnings(total);
    });

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(filePath, file);
    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("payment-proofs").getPublicUrl(filePath);
    await supabase.from("profiles").update({ payment_proof_url: publicUrl }).eq("user_id", user.id);
    await refreshProfile();
    toast.success("Payment proof uploaded!");
    setUploading(false);
  };

  if (!profile) return null;

  // Pending user view
  if (profile.registration_status === "pending") {
    return (
      <div className="page-container">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto mt-12">
          <div className="glass-card p-8 text-center">
            <div className="p-3 rounded-full bg-warning/10 w-fit mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
            <h2 className="page-title mb-2">Account Pending</h2>
            <p className="text-muted-foreground mb-6">
              Your account is awaiting admin approval. Please complete the payment to activate your account.
            </p>
            {settings && (
              <div className="glass-card p-4 text-left mb-4">
                <h3 className="font-semibold mb-2">Payment Instructions</h3>
                <p className="text-sm text-muted-foreground mb-3">{settings.payment_instructions}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Registration Fee:</span>
                    <span className="font-mono-amount glow-text">${Number(settings.registration_fee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MiniPay Number:</span>
                    <span className="font-mono text-sm">{settings.minipay_number}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Wallet Address (TRC20):</span>
                    <span className="font-mono text-xs break-all">{settings.admin_wallet_address}</span>
                  </div>
                </div>
              </div>
            )}
            {profile.payment_proof_url ? (
              <div className="text-sm text-success">✓ Payment proof uploaded. Awaiting admin review.</div>
            ) : (
              <label>
                <Button className="w-full gradient-primary text-primary-foreground" disabled={uploading} asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload Payment Proof"}
                  </span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadProof} />
              </label>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="page-title mb-6">
          Welcome back, <span className="gradient-text">{profile.first_name || profile.username}</span>
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="USDT Balance" value={profile.usdt_balance} icon={DollarSign} isCurrency />
          <StatCard title="Referral Earnings" value={0} icon={Users} isCurrency />
          <StatCard title="Active Tasks" value={taskStats.active} icon={ListChecks} />
          <StatCard title="Pending Verifications" value={taskStats.pending} icon={Clock} />
        </div>
        <div className="glass-card p-6">
          <h2 className="font-display font-semibold text-lg mb-4">Recent Transactions</h2>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium capitalize">{tx.type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-mono-amount text-sm ${tx.type === "withdrawal" ? "text-destructive" : "glow-text"}`}>
                      {tx.type === "withdrawal" ? "-" : "+"}${Number(tx.amount).toFixed(2)}
                    </span>
                    <Badge variant={tx.status === "completed" ? "default" : tx.status === "pending" ? "secondary" : "destructive"} className="text-xs">
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
