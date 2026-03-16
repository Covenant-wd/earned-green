import { motion } from "framer-motion";
import { DollarSign, Users, ListChecks, Clock, AlertTriangle, Upload } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { mockTransactions, mockAdminSettings } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  // Pending user view
  if (user.registrationStatus === "pending") {
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

            <div className="glass-card p-4 text-left mb-4">
              <h3 className="font-semibold mb-2">Payment Instructions</h3>
              <p className="text-sm text-muted-foreground mb-3">{mockAdminSettings.paymentInstructions}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registration Fee:</span>
                  <span className="font-mono-amount glow-text">${mockAdminSettings.registrationFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MiniPay Number:</span>
                  <span className="font-mono text-sm">{mockAdminSettings.minipayNumber}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Wallet Address (TRC20):</span>
                  <span className="font-mono text-xs break-all">{mockAdminSettings.adminWalletAddress}</span>
                </div>
              </div>
            </div>

            <Button className="w-full gradient-primary text-primary-foreground">
              <Upload className="h-4 w-4 mr-2" />
              Upload Payment Proof
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="page-title mb-6">
          Welcome back, <span className="gradient-text">{user.firstName || user.username}</span>
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="USDT Balance" value={user.usdtBalance} icon={DollarSign} isCurrency />
          <StatCard title="Referral Earnings" value={5.00} icon={Users} isCurrency subtitle="2 referrals" />
          <StatCard title="Active Tasks" value={4} icon={ListChecks} />
          <StatCard title="Pending Verifications" value={1} icon={Clock} />
        </div>

        <div className="glass-card p-6">
          <h2 className="font-display font-semibold text-lg mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {mockTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium capitalize">{tx.type.replace("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-mono-amount text-sm ${tx.type === "withdrawal" ? "text-destructive" : "glow-text"}`}>
                    {tx.type === "withdrawal" ? "-" : "+"}${tx.amount.toFixed(2)}
                  </span>
                  <Badge variant={tx.status === "completed" ? "default" : tx.status === "pending" ? "secondary" : "destructive"} className="text-xs">
                    {tx.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
