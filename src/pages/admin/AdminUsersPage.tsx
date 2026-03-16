import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Check, X, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mockPendingUsers } from "@/lib/mock-data";
import { toast } from "sonner";

const allUsers = [
  ...mockPendingUsers,
  { id: "1", username: "johndoe", email: "john@gmail.com", firstName: "John", lastName: "Doe", registrationStatus: "active" as const, paymentProofUrl: "", createdAt: "2024-01-15" },
  { id: "7", username: "rejected1", email: "rej@gmail.com", firstName: "Rex", lastName: "J", registrationStatus: "rejected" as const, paymentProofUrl: "", createdAt: "2024-03-01" },
];

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);

  const filtered = (status: string) =>
    allUsers
      .filter((u) => u.registrationStatus === status)
      .filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase()));

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
                {filtered(status).map((user) => (
                  <div key={user.id} className="glass-card p-4 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Joined: {user.createdAt}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.paymentProofUrl && (
                        <Button variant="outline" size="sm" onClick={() => setProofImage(user.paymentProofUrl)}>
                          <Eye className="h-3 w-3 mr-1" /> Proof
                        </Button>
                      )}
                      {status === "pending" && (
                        <>
                          <Button size="sm" className="bg-success/10 text-success hover:bg-success/20" onClick={() => toast.success(`${user.firstName} approved`)}>
                            <Check className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => toast.error(`${user.firstName} rejected`)}>
                            <X className="h-3 w-3 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      <Badge variant={status === "active" ? "default" : status === "pending" ? "secondary" : "destructive"}>
                        {status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {filtered(status).length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No {status} users found</p>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      <Dialog open={!!proofImage} onOpenChange={() => setProofImage(null)}>
        <DialogContent className="glass-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Payment Proof</DialogTitle>
          </DialogHeader>
          {proofImage && <img src={proofImage} alt="Payment proof" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
