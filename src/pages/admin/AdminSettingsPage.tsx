import { useState } from "react";
import { motion } from "framer-motion";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { mockAdminSettings } from "@/lib/mock-data";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(mockAdminSettings);

  const handleSave = () => {
    toast.success("Settings saved");
  };

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="page-title mb-6">Platform Settings</h1>

        <div className="glass-card p-6 max-w-2xl space-y-5">
          <div>
            <Label>Registration Fee (USDT)</Label>
            <Input
              type="number"
              value={settings.registrationFee}
              onChange={(e) => setSettings({ ...settings, registrationFee: parseFloat(e.target.value) })}
              className="bg-secondary border-border font-mono"
            />
          </div>

          <div>
            <Label>Referral Bonus (%)</Label>
            <Input
              type="number"
              value={settings.referralBonusPercent}
              onChange={(e) => setSettings({ ...settings, referralBonusPercent: parseFloat(e.target.value) })}
              className="bg-secondary border-border font-mono"
            />
          </div>

          <div>
            <Label>Admin Wallet Address (TRC20)</Label>
            <Input
              value={settings.adminWalletAddress}
              onChange={(e) => setSettings({ ...settings, adminWalletAddress: e.target.value })}
              className="bg-secondary border-border font-mono text-sm"
            />
          </div>

          <div>
            <Label>MiniPay Number</Label>
            <Input
              value={settings.minipayNumber}
              onChange={(e) => setSettings({ ...settings, minipayNumber: e.target.value })}
              className="bg-secondary border-border font-mono"
            />
          </div>

          <div>
            <Label>Payment Instructions</Label>
            <Textarea
              value={settings.paymentInstructions}
              onChange={(e) => setSettings({ ...settings, paymentInstructions: e.target.value })}
              className="bg-secondary border-border"
              rows={4}
            />
          </div>

          <Button className="gradient-primary text-primary-foreground" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" /> Save Settings
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
