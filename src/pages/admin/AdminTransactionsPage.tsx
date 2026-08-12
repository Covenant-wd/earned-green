import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { sendNotification } from "@/lib/notifications";
import { toast } from "sonner";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [txHashDialog, setTxHashDialog] = useState<string | null>(null);
  const [txHash, setTxHash] = useState("");
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const load = async () => {
    // Fetch transactions first
    const { data: txData } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
    if (!txData || txData.length === 0) { setTransactions([]); return; }

    // Fetch profiles separately
    const userIds = [...new Set(txData.map((t) => t.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, email")
      .in("user_id", userIds);

    const profileMap = new Map((profilesData || []).map((p) => [p.user_id, p]));
    const enriched = txData.map((t) => ({ ...t, profile: profileMap.get(t.user_id) || null }));
    setTransactions(enriched);
  };

  useEffect(() => { load(); }, []);

  const filtered = (tab: string) =>
    transactions.filter((t) => {
      const matchesSearch = search
        ? `${t.profile?.first_name || ""} ${t.profile?.last_name || ""} ${t.profile?.email || ""} ${t.type}`.toLowerCase().includes(search.toLowerCase())
        : true;
      if (tab === "withdrawal") return t.type === "withdrawal" && matchesSearch;
      return t.status === tab && matchesSearch;
    });

  const handleApprove = async (id: string, userId: string, amount: number) => {
    if (pendingIds.has(id)) return;
    setPendingIds((s) => new Set(s).add(id));

    try {
      // Atomic, idempotent: debits balance exactly once even on double-click
      const { data, error } = await supabase.rpc("approve_withdrawal", {
        _transaction_id: id,
        _tx_hash: txHash || "",
      });
      if (error) { toast.error(error.message); return; }

      const result = data as any;
      if (result?.status === "already_processed") {
        toast.info("This withdrawal was already processed");
        setTxHashDialog(null);
        setTxHash("");
        await load();
        return;
      }

      await sendNotification({
        userId,
        type: "withdrawal_approved",
        title: "Withdrawal processed 💸",
        message: `Your withdrawal of $${amount.toFixed(2)} USDT has been processed${txHash ? `. Transaction hash: ${txHash}` : "."}`,
        link: "/wallet",
      });
      toast.success("Transaction approved");
      setTxHashDialog(null);
      setTxHash("");
      await load();
    } finally {
      setPendingIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  };

  const handleReject = async (id: string) => {
    if (pendingIds.has(id)) return;
    setPendingIds((s) => new Set(s).add(id));

    try {
      const tx = transactions.find((t) => t.id === id);
      const { data, error } = await supabase.rpc("reject_withdrawal", { _transaction_id: id });
      if (error) { toast.error(error.message); return; }

      const result = data as any;
      if (result?.status === "already_processed") {
        toast.info("This withdrawal was already processed");
        await load();
        return;
      }

      if (tx) {
        await sendNotification({
          userId: tx.user_id,
          type: "withdrawal_rejected",
          title: "Withdrawal rejected",
          message: `Your withdrawal request of $${Number(tx.amount).toFixed(2)} USDT was rejected. The amount remains in your wallet balance.`,
          link: "/wallet",
        });
      }
      toast.error("Transaction rejected");
      await load();
    } finally {
      setPendingIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="page-title mb-6">Transactions</h1>
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email or type..." className="pl-10 bg-background" />
        </div>
        <Tabs defaultValue="pending">
          <TabsList className="glass-card mb-6">
            <TabsTrigger value="pending">Pending ({filtered("pending").length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({filtered("completed").length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({filtered("rejected").length})</TabsTrigger>
            <TabsTrigger value="withdrawal">Withdrawals ({filtered("withdrawal").length})</TabsTrigger>
          </TabsList>
          {["pending", "completed", "rejected", "withdrawal"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              <div className="space-y-3">
                {filtered(tab).map((tx) => (
                  <div key={tx.id} className="glass-card p-4 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-medium capitalize">{tx.type.replace("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.profile?.first_name} {tx.profile?.last_name} ({tx.profile?.email}) • {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                      {tx.wallet_address && <p className="text-xs font-mono text-muted-foreground">MiniPay: {tx.wallet_address}</p>}
                      {tx.tx_hash && <p className="text-xs font-mono text-muted-foreground">TX: {tx.tx_hash}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-amount">${Number(tx.amount).toFixed(2)}</span>
                      {tx.status === "pending" && tx.type === "withdrawal" && (
                        <>
                          <Button size="sm" disabled={pendingIds.has(tx.id)} className="bg-success/10 text-success hover:bg-success/20" onClick={() => setTxHashDialog(tx.id)}>
                            <Check className="h-3 w-3 mr-1" /> {pendingIds.has(tx.id) ? "Processing..." : "Approve"}
                          </Button>
                          <Button size="sm" disabled={pendingIds.has(tx.id)} variant="destructive" onClick={() => handleReject(tx.id)}>
                            <X className="h-3 w-3 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      <Badge variant={tx.status === "completed" ? "default" : tx.status === "pending" ? "secondary" : "destructive"}>{tx.status}</Badge>
                    </div>
                  </div>
                ))}
                {filtered(tab).length === 0 && <p className="text-muted-foreground text-center py-8">No transactions</p>}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      <Dialog open={!!txHashDialog} onOpenChange={() => setTxHashDialog(null)}>
        <DialogContent className="glass-card border-border">
          <DialogHeader><DialogTitle className="font-display">Approve Withdrawal</DialogTitle></DialogHeader>
          <div><Label>Transaction Hash (optional)</Label><Input value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="Enter tx hash..." className="bg-background font-mono text-sm" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxHashDialog(null)}>Cancel</Button>
            <Button
              className="gradient-primary text-primary-foreground"
              disabled={!!txHashDialog && pendingIds.has(txHashDialog)}
              onClick={() => {
                const tx = transactions.find((t) => t.id === txHashDialog);
                if (tx) handleApprove(tx.id, tx.user_id, Number(tx.amount));
              }}
            >
              {!!txHashDialog && pendingIds.has(txHashDialog) ? "Processing..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
