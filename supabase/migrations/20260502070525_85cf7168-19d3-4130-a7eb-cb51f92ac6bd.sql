-- Add Flutterwave-related columns to admin_settings
ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS usdt_to_ngn_rate numeric NOT NULL DEFAULT 1600,
  ADD COLUMN IF NOT EXISTS usdt_to_kes_rate numeric NOT NULL DEFAULT 130,
  ADD COLUMN IF NOT EXISTS flutterwave_enabled boolean NOT NULL DEFAULT false;

-- Create payment_intents table to track Flutterwave checkout sessions
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('registration', 'deposit')),
  fiat_currency text NOT NULL CHECK (fiat_currency IN ('NGN', 'KES')),
  fiat_amount numeric NOT NULL,
  usdt_amount numeric NOT NULL,
  exchange_rate numeric NOT NULL,
  tx_ref text NOT NULL UNIQUE,
  flw_tx_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed', 'cancelled')),
  payment_link text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_payment_intents_user_id ON public.payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON public.payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_payment_intents_tx_ref ON public.payment_intents(tx_ref);

ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payment intents"
  ON public.payment_intents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all payment intents"
  ON public.payment_intents FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_payment_intents_updated_at
  BEFORE UPDATE ON public.payment_intents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();