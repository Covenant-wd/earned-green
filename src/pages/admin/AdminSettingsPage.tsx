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
      usdt_to_ngn_rate: settings.usdt_to_ngn_rate,
      usdt_to_kes_rate: settings.usdt_to_kes_rate,
      flutterwave_enabled: settings.flutterwave_enabled,
      payment_methods: settings.payment_methods,
      min_deposit: settings.min_deposit,
      min_withdrawal: settings.min_withdrawal,
      flutterwave_public_key: settings.flutterwave_public_key ?? "",
      flutterwave_secret_key: settings.flutterwave_secret_key ?? "",
      flutterwave_encryption_key: settings.flutterwave_encryption_key ?? "",
      flutterwave_webhook_hash: settings.flutterwave_webhook_hash ?? "",
    } as any).eq("id", settings.id);
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
          <div><Label>Minimum Deposit (USDT)</Label><Input type="number" step="0.01" value={settings.min_deposit ?? 0.01} onChange={(e) => setSettings({ ...settings, min_deposit: parseFloat(e.target.value) })} className="bg-secondary border-border font-mono" /></div>
          <div><Label>Minimum Withdrawal (USDT)</Label><Input type="number" step="0.01" value={settings.min_withdrawal ?? 1} onChange={(e) => setSettings({ ...settings, min_withdrawal: parseFloat(e.target.value) })} className="bg-secondary border-border font-mono" /></div>
          <div><Label>Admin Wallet Address (TRC20)</Label><Input value={settings.admin_wallet_address || ""} onChange={(e) => setSettings({ ...settings, admin_wallet_address: e.target.value })} className="bg-secondary border-border font-mono text-sm" /></div>
          <div><Label>MiniPay Number</Label><Input value={settings.minipay_number || ""} onChange={(e) => setSettings({ ...settings, minipay_number: e.target.value })} className="bg-secondary border-border font-mono" /></div>
          <div><Label>Payment Instructions</Label><Textarea value={settings.payment_instructions || ""} onChange={(e) => setSettings({ ...settings, payment_instructions: e.target.value })} className="bg-secondary border-border" rows={4} /></div>

          <div className="border-t border-border pt-5 space-y-3">
            <Label>Available Payment Methods</Label>
            <p className="text-xs text-muted-foreground">Choose which payment options users see during registration and deposits.</p>
            <div className="space-y-2">
              {[
                { value: "both", label: "Both — Flutterwave & MiniPay/Crypto" },
                { value: "flutterwave", label: "Flutterwave only (NGN / KES)" },
                { value: "minipay", label: "MiniPay / Crypto only (manual proof)" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-secondary/40">
                  <input
                    type="radio"
                    name="payment_methods"
                    value={opt.value}
                    checked={(settings.payment_methods || "both") === opt.value}
                    onChange={(e) => setSettings({ ...settings, payment_methods: e.target.value })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-5 space-y-5">
            <h3 className="font-display font-semibold">Flutterwave Payments (NGN / KES)</h3>
            <div className="flex items-center gap-3">
              <input
                id="flw-enabled"
                type="checkbox"
                checked={!!settings.flutterwave_enabled}
                onChange={(e) => setSettings({ ...settings, flutterwave_enabled: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="flw-enabled" className="cursor-pointer">Enable Flutterwave checkout for registration & deposits</Label>
            </div>
            <div><Label>USDT → NGN rate (1 USDT = ₦?)</Label><Input type="number" value={settings.usdt_to_ngn_rate ?? 1600} onChange={(e) => setSettings({ ...settings, usdt_to_ngn_rate: parseFloat(e.target.value) })} className="bg-secondary border-border font-mono" /></div>
            <div><Label>USDT → KES rate (1 USDT = KSh?)</Label><Input type="number" value={settings.usdt_to_kes_rate ?? 130} onChange={(e) => setSettings({ ...settings, usdt_to_kes_rate: parseFloat(e.target.value) })} className="bg-secondary border-border font-mono" /></div>
            <p className="text-xs text-muted-foreground">
              Webhook URL (set this in your Flutterwave dashboard):
              <br />
              <span className="font-mono break-all text-foreground">https://ljhpnkleqfgudfqkebog.supabase.co/functions/v1/flutterwave-webhook</span>
            </p>
          </div>

          <div className="border-t border-border pt-5 space-y-4">
            <div>
              <h3 className="font-display font-semibold">Flutterwave API Keys</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Paste these from your Flutterwave dashboard → Settings → API Keys. The Secret Hash is whatever value you set in Settings → Webhooks → Secret hash (any string up to 36 chars).
              </p>
            </div>
            <div>
              <Label>Public Key</Label>
              <Input
                value={settings.flutterwave_public_key || ""}
                onChange={(e) => setSettings({ ...settings, flutterwave_public_key: e.target.value })}
                placeholder="FLWPUBK-..."
                className="bg-secondary border-border font-mono text-xs"
              />
            </div>
            <div>
              <Label>Secret Key</Label>
              <Input
                type="password"
                value={settings.flutterwave_secret_key || ""}
                onChange={(e) => setSettings({ ...settings, flutterwave_secret_key: e.target.value })}
                placeholder="FLWSECK-..."
                className="bg-secondary border-border font-mono text-xs"
              />
            </div>
            <div>
              <Label>Encryption Key</Label>
              <Input
                type="password"
                value={settings.flutterwave_encryption_key || ""}
                onChange={(e) => setSettings({ ...settings, flutterwave_encryption_key: e.target.value })}
                placeholder="FLWSECK_TEST..."
                className="bg-secondary border-border font-mono text-xs"
              />
            </div>
            <div>
              <Label>Webhook Secret Hash</Label>
              <Input
                type="password"
                value={settings.flutterwave_webhook_hash || ""}
                onChange={(e) => setSettings({ ...settings, flutterwave_webhook_hash: e.target.value })}
                placeholder="Any string up to 36 chars"
                maxLength={36}
                className="bg-secondary border-border font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">Must match the Secret hash you saved in Flutterwave → Settings → Webhooks.</p>
            </div>
          </div>

          <Button className="gradient-primary text-primary-foreground" onClick={handleSave}><Save className="h-4 w-4 mr-2" /> Save Settings</Button>
        </div>
      </motion.div>
    </div>
  );
}
