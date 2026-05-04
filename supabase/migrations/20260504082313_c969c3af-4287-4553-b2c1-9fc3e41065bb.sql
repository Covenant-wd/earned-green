ALTER TABLE public.admin_settings
ADD COLUMN IF NOT EXISTS payment_methods text NOT NULL DEFAULT 'both'
CHECK (payment_methods IN ('flutterwave', 'minipay', 'both'));