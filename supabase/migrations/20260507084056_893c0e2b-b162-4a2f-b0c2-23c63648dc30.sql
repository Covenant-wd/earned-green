ALTER TABLE public.admin_settings
ADD COLUMN IF NOT EXISTS min_deposit numeric NOT NULL DEFAULT 0.01,
ADD COLUMN IF NOT EXISTS min_withdrawal numeric NOT NULL DEFAULT 1;

DROP FUNCTION IF EXISTS public.get_public_settings();

CREATE OR REPLACE FUNCTION public.get_public_settings()
 RETURNS TABLE(registration_fee numeric, admin_wallet_address text, minipay_number text, payment_instructions text, usdt_to_ngn_rate numeric, usdt_to_kes_rate numeric, flutterwave_enabled boolean, payment_methods text, referral_bonus_percent numeric, min_deposit numeric, min_withdrawal numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    registration_fee,
    admin_wallet_address,
    minipay_number,
    payment_instructions,
    usdt_to_ngn_rate,
    usdt_to_kes_rate,
    flutterwave_enabled,
    payment_methods,
    referral_bonus_percent,
    min_deposit,
    min_withdrawal
  FROM public.admin_settings
  LIMIT 1;
$function$;