import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    country: "",
    state: "",
    address: "",
    minipay_number: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name || "",
        middle_name: profile.middle_name || "",
        last_name: profile.last_name || "",
        country: profile.country || "",
        state: profile.state || "",
        address: profile.address || "",
        minipay_number: (profile as any).minipay_number || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update(form)
      .eq("user_id", profile.user_id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated!");
    await refreshProfile();
  };

  if (!profile) return null;

  return (
    <div className="page-container max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-primary">
            <User className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="page-title">My Profile</h1>
            <p className="text-sm text-muted-foreground">@{profile.username} • {profile.email}</p>
          </div>
        </div>

        <div className="glass-card p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>First Name</Label>
              <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="bg-background" />
            </div>
            <div>
              <Label>Middle Name</Label>
              <Input value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} className="bg-background" />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="bg-background" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Country</Label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="bg-background" />
            </div>
            <div>
              <Label>State</Label>
              <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="bg-background" />
            </div>
          </div>

          <div>
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="bg-background" />
          </div>

          <div>
            <Label>MiniPay Number</Label>
            <Input value={form.minipay_number} onChange={(e) => setForm({ ...form, minipay_number: e.target.value })} className="bg-background font-mono text-sm" placeholder="Enter your MiniPay number" />
          </div>

          <div className="glass-card p-4 bg-muted/30 space-y-2">
            <p className="text-sm text-muted-foreground"><strong className="text-foreground">Referral Code:</strong> <span className="font-mono">{profile.referral_code}</span></p>
            <p className="text-sm text-muted-foreground"><strong className="text-foreground">Balance:</strong> <span className="font-mono-amount glow-text">${Number(profile.usdt_balance).toFixed(2)}</span></p>
            <p className="text-sm text-muted-foreground"><strong className="text-foreground">Status:</strong> <span className="capitalize">{profile.registration_status}</span></p>
          </div>

          <Button className="gradient-primary text-primary-foreground w-full" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
