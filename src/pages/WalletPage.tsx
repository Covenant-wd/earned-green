import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Copy, ArrowDownToLine, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { mockTransactions } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function WalletPage() {
  const { user } = useAuth();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [walletAddr, setWalletAddr] = useState("");
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const referralLink = `${window.location.origin}/register?ref=${user.referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 1) {
      toast.error("Minimum withdrawal is $1.00 USDT");
      return;
    }
    if (amt > user.usdtBalance) {
      toast.error("Insufficient balance");
      return;
    }
    if (!walletAddr.trim()) {
      toast.error("Enter wallet address");
      return;
    }
    toast.success("Withdrawal request submitted!");
    setWithdrawOpen(false);
    setAmount("");
    setWalletAddr("");
  };

  const typeIcon = (type: string) => {
    if (type === "withdrawal") return "text-destructive";
    return "glow-text";
  };

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="page-title mb-6">Wallet</h1>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg gradient-primary">
                <Wallet className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-muted-foreground">USDT Balance</span>
            </div>
            <p className="text-4xl font-mono-amount glow-text mb-4">
              ${user.usdtBalance.toFixed(2)}
            </p>
            <Button className="gradient-primary text-primary-foreground" onClick={() => setWithdrawOpen(true)}>
              <ArrowDownToLine className="h-4 w-4 mr-2" /> Withdraw
            </Button>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-display font-semibold mb-3">Referral Link</h3>
            <p className="text-xs text-muted-foreground mb-3">Share and earn {10}% bonus on referral registration fees</p>
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="bg-secondary border-border font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copyLink}>
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Your code: <span className="font-mono text-primary">{user.referralCode}</span>
            </p>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="font-display font-semibold text-lg mb-4">Transaction History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2">Type</th>
                  <th className="text-right py-2">Amount</th>
                  <th className="text-center py-2">Status</th>
                  <th className="text-right py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border last:border-0">
                    <td className="py-3 capitalize">{tx.type.replace("_", " ")}</td>
                    <td className={`py-3 text-right font-mono-amount ${typeIcon(tx.type)}`}>
                      {tx.type === "withdrawal" ? "-" : "+"}${tx.amount.toFixed(2)}
                    </td>
                    <td className="py-3 text-center">
                      <Badge variant={tx.status === "completed" ? "default" : "secondary"} className="text-xs">
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Withdraw USDT</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount (min $1.00)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="bg-secondary border-border font-mono" min="1" step="0.01" />
            </div>
            <div>
              <Label>Wallet Address (TRC20)</Label>
              <Input value={walletAddr} onChange={(e) => setWalletAddr(e.target.value)} placeholder="TRC20 wallet address" className="bg-secondary border-border font-mono text-sm" />
            </div>
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
