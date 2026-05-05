ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS flutterwave_public_key text DEFAULT '',
  ADD COLUMN IF NOT EXISTS flutterwave_secret_key text DEFAULT '',
  ADD COLUMN IF NOT EXISTS flutterwave_encryption_key text DEFAULT '',
  ADD COLUMN IF NOT EXISTS flutterwave_webhook_hash text DEFAULT '';

-- Restrict SELECT on admin_settings to admins only (keys are sensitive).
-- Provide a SECURITY DEFINER function for non-admin clients that only
-- exposes the safe public fields used by the payment UI.
DROP POLICY IF EXISTS "Anyone can read settings" ON public.admin_settings;

CREATE POLICY "Admins can read settings"
ON public.admin_settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.get_public_settings()
RETURNS TABLE (
  registration_fee numeric,
  admin_wallet_address text,
  minipay_number text,
  payment_instructions text,
  usdt_to_ngn_rate numeric,
  usdt_to_kes_rate numeric,
  flutterwave_enabled boolean,
  payment_methods text,
  referral_bonus_percent numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    registration_fee,
    admin_wallet_address,
    minipay_number,
    payment_instructions,
    usdt_to_ngn_rate,
    usdt_to_kes_rate,
    flutterwave_enabled,
    payment_methods,
    referral_bonus_percent
  FROM public.admin_settings
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_settings() TO authenticated, anon;