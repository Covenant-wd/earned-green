
CREATE OR REPLACE FUNCTION public.get_user_downlines(_profile_id uuid)
RETURNS TABLE(
  id uuid,
  username text,
  first_name text,
  last_name text,
  email text,
  registration_status text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.username, p.first_name, p.last_name, p.email, p.registration_status, p.created_at
  FROM public.profiles p
  WHERE p.referred_by_id = _profile_id
  ORDER BY p.created_at DESC;
$$;
