import { motion } from "framer-motion";
import { Users, Clock, ClipboardCheck, ArrowDownToLine, DollarSign, CheckCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { mockPendingUsers, mockTransactions } from "@/lib/mock-data";

export default function AdminDashboard() {
  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="page-title mb-6">Admin Overview</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard title="Active Users" value={42} icon={Users} />
          <StatCard title="Pending Approvals" value={mockPendingUsers.length} icon={Clock} />
          <StatCard title="Proofs to Review" value={5} icon={ClipboardCheck} />
          <StatCard title="Pending Withdrawals" value={3} icon={ArrowDownToLine} isCurrency />
          <StatCard title="Earnings Paid Out" value={1250.50} icon={DollarSign} isCurrency />
          <StatCard title="Withdrawals Completed" value={28} icon={CheckCircle} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass-card p-6">
            <h2 className="font-display font-semibold text-lg mb-4">Recent Registrations</h2>
            <div className="space-y-3">
              {mockPendingUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Badge variant="secondary">{u.registrationStatus}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="font-display font-semibold text-lg mb-4">Recent Transactions</h2>
            <div className="space-y-3">
              {mockTransactions.slice(0, 4).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium capitalize">{tx.type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="font-mono-amount text-sm">${tx.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
