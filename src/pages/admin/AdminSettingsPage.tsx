import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("admin_settings").select("*").limit(1).single().then(({ data }) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    const { error } = await supabase.from("admin_settings").update({
      registration_fee: settings.registration_fee,
      referral_bonus_percent: settings.referral_bonus_percent,
      admin_wallet_address: settings.admin_wallet_address,
      minipay_number: settings.minipay_number,
      payment_instructions: settings.payment_instructions,
    }).eq("id", settings.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Settings saved");
  };

  if (loading || !settings) return <div className="page-container"><p className="text-muted-foreground">Loading...</p></div>;

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="page-title mb-6">Platform Settings</h1>
        <div className="glass-card p-6 max-w-2xl space-y-5">
          <div><Label>Registration Fee (USDT)</Label><Input type="number" value={settings.registration_fee} onChange={(e) => setSettings({ ...settings, registration_fee: parseFloat(e.target.value) })} className="bg-secondary border-border font-mono" /></div>
          <div><Label>Referral Bonus (%)</Label><Input type="number" value={settings.referral_bonus_percent} onChange={(e) => setSettings({ ...settings, referral_bonus_percent: parseFloat(e.target.value) })} className="bg-secondary border-border font-mono" /></div>
          <div><Label>Admin Wallet Address (TRC20)</Label><Input value={settings.admin_wallet_address || ""} onChange={(e) => setSettings({ ...settings, admin_wallet_address: e.target.value })} className="bg-secondary border-border font-mono text-sm" /></div>
          <div><Label>MiniPay Number</Label><Input value={settings.minipay_number || ""} onChange={(e) => setSettings({ ...settings, minipay_number: e.target.value })} className="bg-secondary border-border font-mono" /></div>
          <div><Label>Payment Instructions</Label><Textarea value={settings.payment_instructions || ""} onChange={(e) => setSettings({ ...settings, payment_instructions: e.target.value })} className="bg-secondary border-border" rows={4} /></div>
          <Button className="gradient-primary text-primary-foreground" onClick={handleSave}><Save className="h-4 w-4 mr-2" /> Save Settings</Button>
        </div>
      </motion.div>
    </div>
  );
}
