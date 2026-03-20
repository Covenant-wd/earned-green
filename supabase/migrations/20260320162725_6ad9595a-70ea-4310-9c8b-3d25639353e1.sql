
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _referral_code text;
  _referrer_id uuid;
BEGIN
  _referral_code := NEW.raw_user_meta_data->>'referral_code';
  
  IF _referral_code IS NOT NULL AND _referral_code != '' THEN
    SELECT id INTO _referrer_id FROM public.profiles WHERE referral_code = upper(_referral_code) LIMIT 1;
  END IF;

  INSERT INTO public.profiles (user_id, username, email, first_name, last_name, referral_code, referred_by_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    public.generate_referral_code(),
    _referrer_id
  );
  RETURN NEW;
END;
$function$;
