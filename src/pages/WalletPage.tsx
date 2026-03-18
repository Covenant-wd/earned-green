import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, Copy, ArrowDownToLine, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function WalletPage() {
  const { user, profile } = useAuth();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [walletAddr, setWalletAddr] = useState("");
  const [copied, setCopied] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setTransactions(data || []));
  }, [user]);

  if (!profile) return null;

  const referralLink = `${window.location.origin}/register?ref=${profile.referral_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 1) { toast.error("Minimum withdrawal is $1.00 USDT"); return; }
    if (amt > profile.usdt_balance) { toast.error("Insufficient balance"); return; }
    if (!walletAddr.trim()) { toast.error("Enter wallet address"); return; }
    const { error } = await supabase.from("transactions").insert({
      user_id: user!.id,
      amount: amt,
      type: "withdrawal",
      status: "pending",
      wallet_address: walletAddr.trim(),
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Withdrawal request submitted!");
    setWithdrawOpen(false);
    setAmount("");
    setWalletAddr("");
    const { data } = await supabase.from("transactions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    setTransactions(data || []);
  };

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="page-title mb-6">Wallet</h1>
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg gradient-primary"><Wallet className="h-5 w-5 text-primary-foreground" /></div>
              <span className="text-muted-foreground">USDT Balance</span>
            </div>
            <p className="text-4xl font-mono-amount glow-text mb-4">${Number(profile.usdt_balance).toFixed(2)}</p>
            <Button className="gradient-primary text-primary-foreground" onClick={() => setWithdrawOpen(true)}>
              <ArrowDownToLine className="h-4 w-4 mr-2" /> Withdraw
            </Button>
          </div>
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold mb-3">Referral Link</h3>
            <p className="text-xs text-muted-foreground mb-3">Share and earn a bonus on referral registration fees</p>
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="bg-secondary border-border font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copyLink}>
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Your code: <span className="font-mono text-primary">{profile.referral_code}</span></p>
          </div>
        </div>
        <div className="glass-card p-6">
          <h2 className="font-display font-semibold text-lg mb-4">Transaction History</h2>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2">Type</th><th className="text-right py-2">Amount</th><th className="text-center py-2">Status</th><th className="text-right py-2">Date</th>
                </tr></thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-border last:border-0">
                      <td className="py-3 capitalize">{tx.type.replace("_", " ")}</td>
                      <td className={`py-3 text-right font-mono-amount ${tx.type === "withdrawal" ? "text-destructive" : "glow-text"}`}>
                        {tx.type === "withdrawal" ? "-" : "+"}${Number(tx.amount).toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        <Badge variant={tx.status === "completed" ? "default" : "secondary"} className="text-xs">{tx.status}</Badge>
                      </td>
                      <td className="py-3 text-right text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader><DialogTitle className="font-display">Withdraw USDT</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Amount (min $1.00)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="bg-secondary border-border font-mono" min="1" step="0.01" /></div>
            <div><Label>Wallet Address (TRC20)</Label><Input value={walletAddr} onChange={(e) => setWalletAddr(e.target.value)} placeholder="TRC20 wallet address" className="bg-secondary border-border font-mono text-sm" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleWithdraw}>Request Withdrawal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
