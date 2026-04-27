-- Restrict EXECUTE on the new approval functions to authenticated users only.
-- The functions still check has_role() internally, so non-admins are rejected.
REVOKE EXECUTE ON FUNCTION public.approve_user_registration(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_user_registration(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.approve_task_completion(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_task_completion(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.approve_withdrawal(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_withdrawal(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.approve_user_registration(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_user_registration(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_task_completion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_task_completion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_withdrawal(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_withdrawal(uuid) TO authenticated;