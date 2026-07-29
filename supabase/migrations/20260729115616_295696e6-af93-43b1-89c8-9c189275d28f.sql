CREATE OR REPLACE FUNCTION public.is_approved_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND registration_status = 'active'
  )
$$;

DROP POLICY IF EXISTS "Anyone authenticated can read published courses" ON public.courses;
CREATE POLICY "Approved users can read published courses"
ON public.courses FOR SELECT TO authenticated
USING ((is_published = true AND public.is_approved_user(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone authenticated can read published lessons" ON public.lessons;
CREATE POLICY "Approved users can read published lessons"
ON public.lessons FOR SELECT TO authenticated
USING ((is_published = true AND public.is_approved_user(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone authenticated can read published guides" ON public.guides;
CREATE POLICY "Approved users can read published guides"
ON public.guides FOR SELECT TO authenticated
USING ((is_published = true AND public.is_approved_user(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can read active tasks" ON public.tasks;
CREATE POLICY "Approved users can read active tasks"
ON public.tasks FOR SELECT TO authenticated
USING ((is_active = true AND public.is_approved_user(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can submit completions" ON public.task_completions;
CREATE POLICY "Approved users can submit completions"
ON public.task_completions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_approved_user(auth.uid()));