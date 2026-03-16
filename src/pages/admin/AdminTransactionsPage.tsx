import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { mockTransactions } from "@/lib/mock-data";
import { toast } from "sonner";

export default function AdminTransactionsPage() {
  const [search, setSearch] = useState("");
  const [txHashDialog, setTxHashDialog] = useState<string | null>(null);
  const [txHash, setTxHash] = useState("");

  const filtered = (status: string) =>
    mockTransactions.filter((t) => {
      if (status === "withdrawal") return t.type === "withdrawal";
      return t.status === status;
    });

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="page-title mb-6">Transactions</h1>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-10 bg-secondary border-border" />
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="glass-card mb-6">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="withdrawal">Withdrawals</TabsTrigger>
          </TabsList>

          {["pending", "completed", "rejected", "withdrawal"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              <div className="space-y-3">
                {filtered(tab).map((tx) => (
                  <div key={tx.id} className="glass-card p-4 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-medium capitalize">{tx.type.replace("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">
                        User: {tx.userId} • {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                      {tx.txHash && <p className="text-xs font-mono text-muted-foreground">TX: {tx.txHash}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-amount">${tx.amount.toFixed(2)}</span>
                      {tx.status === "pending" && tx.type === "withdrawal" && (
                        <>
                          <Button size="sm" className="bg-success/10 text-success hover:bg-success/20" onClick={() => setTxHashDialog(tx.id)}>
                            <Check className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => toast.error("Withdrawal rejected")}>
                            <X className="h-3 w-3 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      <Badge variant={tx.status === "completed" ? "default" : tx.status === "pending" ? "secondary" : "destructive"}>
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {filtered(tab).length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No transactions</p>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      <Dialog open={!!txHashDialog} onOpenChange={() => setTxHashDialog(null)}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Approve Withdrawal</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Transaction Hash (optional)</Label>
            <Input value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="Enter tx hash..." className="bg-secondary border-border font-mono text-sm" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxHashDialog(null)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={() => { toast.success("Withdrawal approved"); setTxHashDialog(null); setTxHash(""); }}>
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
