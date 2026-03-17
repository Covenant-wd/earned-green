import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Check, X, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);

  const loadUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = (status: string) =>
    users.filter((u) => u.registration_status === status)
      .filter((u) => `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase()));

  const updateStatus = async (userId: string, userAuthId: string, status: string, name: string) => {
    const { error } = await supabase.from("profiles").update({ registration_status: status }).eq("user_id", userAuthId);
    if (error) { toast.error(error.message); return; }
    toast.success(`${name} ${status === "active" ? "approved" : "rejected"}`);
    loadUsers();
  };

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="page-title mb-6">Manage Users</h1>
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="pl-10 bg-secondary border-border" />
        </div>
        <Tabs defaultValue="pending">
          <TabsList className="glass-card mb-6">
            <TabsTrigger value="pending">Pending ({filtered("pending").length})</TabsTrigger>
            <TabsTrigger value="active">Active ({filtered("active").length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({filtered("rejected").length})</TabsTrigger>
          </TabsList>
          {["pending", "active", "rejected"].map((status) => (
            <TabsContent key={status} value={status}>
              <div className="space-y-3">
                {filtered(status).map((u) => (
                  <div key={u.id} className="glass-card p-4 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-medium">{u.first_name} {u.last_name}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      <p className="text-xs text-muted-foreground">Joined: {new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {u.payment_proof_url && (
                        <Button variant="outline" size="sm" onClick={() => setProofImage(u.payment_proof_url)}>
                          <Eye className="h-3 w-3 mr-1" /> Proof
                        </Button>
                      )}
                      {status === "pending" && (
                        <>
                          <Button size="sm" className="bg-success/10 text-success hover:bg-success/20" onClick={() => updateStatus(u.id, u.user_id, "active", u.first_name)}>
                            <Check className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => updateStatus(u.id, u.user_id, "rejected", u.first_name)}>
                            <X className="h-3 w-3 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      <Badge variant={status === "active" ? "default" : status === "pending" ? "secondary" : "destructive"}>{status}</Badge>
                    </div>
                  </div>
                ))}
                {filtered(status).length === 0 && <p className="text-muted-foreground text-center py-8">No {status} users found</p>}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
      <Dialog open={!!proofImage} onOpenChange={() => setProofImage(null)}>
        <DialogContent className="glass-card border-border max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Payment Proof</DialogTitle></DialogHeader>
          {proofImage && <img src={proofImage} alt="Payment proof" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
