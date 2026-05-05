REVOKE EXECUTE ON FUNCTION public.get_public_settings() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_public_settings() TO authenticated;