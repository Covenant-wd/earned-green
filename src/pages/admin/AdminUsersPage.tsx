import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Check, X, Eye, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { sendNotification } from "@/lib/notifications";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<any>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", email: "", country: "", state: "", address: "", wallet_address: "", usdt_balance: "", registration_status: "" });

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

    // Credit referral bonus when approving a user
    if (status === "active") {
      const { data: approvedProfile } = await supabase.from("profiles").select("referred_by_id").eq("user_id", userAuthId).single();
      if (approvedProfile?.referred_by_id) {
        const { data: settings } = await supabase.from("admin_settings").select("registration_fee, referral_bonus_percent").limit(1).single();
        if (settings) {
          const bonus = (Number(settings.registration_fee) * Number(settings.referral_bonus_percent)) / 100;
          const { data: referrer } = await supabase.from("profiles").select("usdt_balance, user_id").eq("id", approvedProfile.referred_by_id).single();
          if (referrer) {
            await supabase.from("profiles").update({ usdt_balance: Number(referrer.usdt_balance) + bonus }).eq("id", approvedProfile.referred_by_id);
            await supabase.from("transactions").insert({ user_id: referrer.user_id, amount: bonus, type: "referral_bonus", status: "completed" });
          }
        }
      }
    }

    // Send notification + email
    if (status === "active") {
      await sendNotification({
        userId: userAuthId,
        type: "account_approved",
        title: "Your account has been approved 🎉",
        message: `Hi ${name || "there"}, your EntreVault account is now active. You can start completing tasks and earning USDT right away!`,
        link: "/dashboard",
      });
    } else if (status === "rejected") {
      await sendNotification({
        userId: userAuthId,
        type: "account_rejected",
        title: "Account registration update",
        message: `Hi ${name || "there"}, unfortunately your registration could not be approved at this time. Please contact support if you believe this is an error.`,
      });
    }

    toast.success(`${name} ${status === "active" ? "approved" : "rejected"}`);
    loadUsers();
  };

  const openEdit = (u: any) => {
    setEditUser(u);
    setEditForm({
      first_name: u.first_name || "",
      last_name: u.last_name || "",
      email: u.email || "",
      country: u.country || "",
      state: u.state || "",
      address: u.address || "",
      wallet_address: u.wallet_address || "",
      usdt_balance: String(u.usdt_balance || 0),
      registration_status: u.registration_status || "pending",
    });
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    const { error } = await supabase.from("profiles").update({
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      email: editForm.email,
      country: editForm.country || null,
      state: editForm.state || null,
      address: editForm.address || null,
      wallet_address: editForm.wallet_address || null,
      usdt_balance: parseFloat(editForm.usdt_balance) || 0,
      registration_status: editForm.registration_status,
    }).eq("user_id", editUser.user_id);
    if (error) { toast.error(error.message); return; }
    toast.success("User updated");
    setEditUser(null);
    loadUsers();
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    const user = users.find((u) => u.id === deleteUserId);
    if (!user) return;
    // Delete related data first, then the profile
    await supabase.from("task_completions").delete().eq("user_id", user.user_id);
    await supabase.from("transactions").delete().eq("user_id", user.user_id);
    const { error } = await supabase.from("profiles").delete().eq("user_id", user.user_id);
    if (error) { toast.error(error.message); return; }
    toast.success("User deleted");
    setDeleteUserId(null);
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
                      <p className="text-xs text-muted-foreground">Joined: {new Date(u.created_at).toLocaleDateString()} • Balance: <span className="font-mono-amount">${Number(u.usdt_balance).toFixed(2)}</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      {u.payment_proof_url && (
                        <Button variant="outline" size="sm" onClick={() => setProofImage(u.payment_proof_url)}>
                          <Eye className="h-3 w-3 mr-1" /> Proof
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteUserId(u.id)}>
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
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

      {/* Proof Image Dialog */}
      <Dialog open={!!proofImage} onOpenChange={() => setProofImage(null)}>
        <DialogContent className="glass-card border-border max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Payment Proof</DialogTitle></DialogHeader>
          {proofImage && <img src={proofImage} alt="Payment proof" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="glass-card border-border max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Edit User</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First Name</Label><Input value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} className="bg-secondary border-border" /></div>
              <div><Label>Last Name</Label><Input value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} className="bg-secondary border-border" /></div>
            </div>
            <div><Label>Email</Label><Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="bg-secondary border-border" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Country</Label><Input value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} className="bg-secondary border-border" /></div>
              <div><Label>State</Label><Input value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} className="bg-secondary border-border" /></div>
            </div>
            <div><Label>Address</Label><Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="bg-secondary border-border" /></div>
            <div><Label>Wallet Address</Label><Input value={editForm.wallet_address} onChange={(e) => setEditForm({ ...editForm, wallet_address: e.target.value })} className="bg-secondary border-border font-mono text-sm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>USDT Balance</Label><Input type="number" value={editForm.usdt_balance} onChange={(e) => setEditForm({ ...editForm, usdt_balance: e.target.value })} className="bg-secondary border-border font-mono" step="0.01" /></div>
              <div>
                <Label>Status</Label>
                <Select value={editForm.registration_status} onValueChange={(v) => setEditForm({ ...editForm, registration_status: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleEditSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent className="glass-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete User</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this user and all their data (tasks, transactions). This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
