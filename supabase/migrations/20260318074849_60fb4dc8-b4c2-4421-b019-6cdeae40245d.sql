CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete task_completions" ON public.task_completions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete transactions" ON public.transactions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));