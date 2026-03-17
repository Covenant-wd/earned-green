
-- Fix search_path on generate_referral_code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE sql
SET search_path = public
AS $$
  SELECT upper(substr(md5(random()::text), 1, 8))
$$;
