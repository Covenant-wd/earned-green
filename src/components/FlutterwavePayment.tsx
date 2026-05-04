import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  purpose: "registration" | "deposit";
  fixedUsdtAmount?: number; // for registration
}

export function FlutterwavePayment({ purpose, fixedUsdtAmount }: Props) {
  const [currency, setCurrency] = useState<"NGN" | "KES">("NGN");
  const [usdtAmount, setUsdtAmount] = useState<string>(
    fixedUsdtAmount ? String(fixedUsdtAmount) : ""
  );
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    supabase
      .from("admin_settings")
      .select("*")
      .limit(1)
      .single()
      .then(({ data }) => setSettings(data));
  }, []);

  if (!settings) return null;
  const method = (settings as any).payment_methods || "both";
  if (!(settings as any).flutterwave_enabled) return null;
  if (method === "minipay") return null;

  const rate =
    currency === "NGN"
      ? Number((settings as any).usdt_to_ngn_rate)
      : Number((settings as any).usdt_to_kes_rate);
  const amt = Number(usdtAmount) || 0;
  const fiat = (amt * rate).toFixed(2);
  const symbol = currency === "NGN" ? "₦" : "KSh";

  const handlePay = async () => {
    if (purpose === "deposit" && amt < 1) {
      toast.error("Minimum deposit is 1 USDT");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "flutterwave-initiate",
        {
          body: {
            purpose,
            currency,
            usdt_amount: amt,
            redirect_url: `${window.location.origin}/dashboard`,
          },
        }
      );
      if (error || !data?.payment_link) {
        toast.error(error?.message || data?.error || "Payment init failed");
        setLoading(false);
        return;
      }
      window.location.href = data.payment_link;
    } catch (e: any) {
      toast.error(e.message || "Payment failed");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {!fixedUsdtAmount && (
        <div>
          <Label>Amount in USDT</Label>
          <Input
            type="number"
            value={usdtAmount}
            onChange={(e) => setUsdtAmount(e.target.value)}
            placeholder="0.00"
            min="1"
            step="0.01"
            className="bg-secondary border-border font-mono"
          />
        </div>
      )}
      <div>
        <Label>Pay in</Label>
        <Select value={currency} onValueChange={(v: "NGN" | "KES") => setCurrency(v)}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
            <SelectItem value="KES">Kenyan Shilling (KES)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {amt > 0 && (
        <div className="text-sm text-muted-foreground flex justify-between p-3 rounded-lg bg-secondary/40">
          <span>You'll pay:</span>
          <span className="font-mono text-foreground">
            {symbol}{Number(fiat).toLocaleString()}
          </span>
        </div>
      )}
      <Button
        onClick={handlePay}
        disabled={loading || amt <= 0}
        className="w-full gradient-primary text-primary-foreground"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4 mr-2" />
        )}
        Pay with Flutterwave
      </Button>
    </div>
  );
}
