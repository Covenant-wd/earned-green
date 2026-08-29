-- =====================================================================
-- EntreVault 2.0 : drop the old earning platform
-- =====================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS public.approve_task_completion(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.approve_user_registration(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.approve_withdrawal(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.auto_close_task_on_external_update() CASCADE;
DROP FUNCTION IF EXISTS public.auto_close_task_when_full() CASCADE;
DROP FUNCTION IF EXISTS public.enforce_task_capacity() CASCADE;
DROP FUNCTION IF EXISTS public.generate_referral_code() CASCADE;
DROP FUNCTION IF EXISTS public.get_public_settings() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_downlines(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.notify_task_closed() CASCADE;
DROP FUNCTION IF EXISTS public.reject_task_completion(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.reject_user_registration(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.reject_withdrawal(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_approved_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;

DROP TABLE IF EXISTS public.task_completions CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.payment_intents CASCADE;
DROP TABLE IF EXISTS public.guides CASCADE;
DROP TABLE IF EXISTS public.lesson_progress CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.admin_settings CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.email_preferences CASCADE;
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;

-- =====================================================================
-- Roles : admin / teacher / student
-- =====================================================================
ALTER TABLE public.user_roles ALTER COLUMN role TYPE text USING role::text;
DROP TYPE IF EXISTS public.app_role;
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');
UPDATE public.user_roles SET role = 'student' WHERE role NOT IN ('admin', 'teacher');
ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING role::public.app_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
$$;

-- =====================================================================
-- Profiles : learning fields only
-- =====================================================================
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='profiles' LOOP
    EXECUTE format('DROP POLICY %I ON public.profiles', p.policyname);
  END LOOP;
END $$;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS middle_name,
  DROP COLUMN IF EXISTS country,
  DROP COLUMN IF EXISTS state,
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS wallet_address,
  DROP COLUMN IF EXISTS minipay_number,
  DROP COLUMN IF EXISTS referral_code,
  DROP COLUMN IF EXISTS referred_by_id,
  DROP COLUMN IF EXISTS usdt_balance,
  DROP COLUMN IF EXISTS registration_status,
  DROP COLUMN IF EXISTS payment_proof_url;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Africa/Lagos';

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, email, first_name, last_name, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'Africa/Lagos')
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- Courses / Modules / Lessons
-- =====================================================================
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  description text,
  thumbnail_url text,
  category text,
  level text NOT NULL DEFAULT 'Beginner',
  learning_objectives text[] NOT NULL DEFAULT '{}',
  duration_weeks integer,
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.course_instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  title text,
  is_lead boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, teacher_id)
);
GRANT SELECT ON public.course_instructors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_instructors TO authenticated;
GRANT ALL ON public.course_instructors TO service_role;
ALTER TABLE public.course_instructors ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.modules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modules TO authenticated;
GRANT ALL ON public.modules TO service_role;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content text,
  sort_order integer NOT NULL DEFAULT 0,
  duration_minutes integer,
  is_published boolean NOT NULL DEFAULT true,
  is_free_preview boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lessons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- Payment plans / enrollments / subscriptions / payments
-- =====================================================================
CREATE TABLE public.payment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NGN',
  billing_interval text NOT NULL DEFAULT 'monthly',
  interval_count integer NOT NULL DEFAULT 1,
  access_days integer,
  is_active boolean NOT NULL DEFAULT true,
  is_archived boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_plans_interval_check CHECK (billing_interval IN ('daily','weekly','monthly','yearly','one_time'))
);
GRANT SELECT ON public.payment_plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_plans TO authenticated;
GRANT ALL ON public.payment_plans TO service_role;
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  access_expires_at timestamptz,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id),
  CONSTRAINT enrollments_status_check CHECK (status IN ('pending','active','expired','cancelled'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.payment_plans(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  provider text,
  provider_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_status_check CHECK (status IN ('pending','active','expired','cancelled'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  plan_id uuid REFERENCES public.payment_plans(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  provider text NOT NULL DEFAULT 'flutterwave',
  provider_ref text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_ref),
  CONSTRAINT payments_status_check CHECK (status IN ('pending','successful','failed','refunded'))
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- Access helper
-- =====================================================================
CREATE OR REPLACE FUNCTION public.has_course_access(_user_id uuid, _course_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.course_instructors WHERE course_id = _course_id AND teacher_id = _user_id)
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.user_id = _user_id AND e.course_id = _course_id AND e.status = 'active'
        AND (e.access_expires_at IS NULL OR e.access_expires_at > now())
    )
    OR EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = _user_id AND s.course_id = _course_id AND s.status = 'active'
        AND (s.current_period_end IS NULL OR s.current_period_end > now())
    )
$$;

CREATE OR REPLACE FUNCTION public.teaches_course(_user_id uuid, _course_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.course_instructors WHERE course_id = _course_id AND teacher_id = _user_id)
$$;

-- =====================================================================
-- Live sessions / chat / attendance / recordings
-- =====================================================================
CREATE TABLE public.live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  teacher_id uuid,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  timezone text NOT NULL DEFAULT 'Africa/Lagos',
  room_name text,
  provider text NOT NULL DEFAULT 'placeholder',
  recording_enabled boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'scheduled',
  chat_locked boolean NOT NULL DEFAULT false,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT live_sessions_status_check CHECK (status IN ('scheduled','live','ended','cancelled'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_sessions TO authenticated;
GRANT ALL ON public.live_sessions TO service_role;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.session_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.session_messages TO authenticated;
GRANT ALL ON public.session_messages TO service_role;
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz,
  left_at timestamptz,
  duration_seconds integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'present',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id),
  CONSTRAINT attendance_status_check CHECK (status IN ('present','late','left_early','absent'))
);
GRANT SELECT, INSERT, UPDATE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.live_sessions(id) ON DELETE SET NULL,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  storage_path text,
  external_url text,
  duration_seconds integer,
  status text NOT NULL DEFAULT 'processing',
  is_available boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recordings_status_check CHECK (status IN ('processing','available','failed'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recordings TO authenticated;
GRANT ALL ON public.recordings TO service_role;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- Resources / assignments / submissions / progress
-- =====================================================================
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.live_sessions(id) ON DELETE SET NULL,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'link',
  url text,
  storage_path text,
  content text,
  is_public boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT resources_type_check CHECK (type IN ('pdf','image','code','zip','link','note','video','other'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  instructions text,
  due_at timestamptz,
  submission_type text NOT NULL DEFAULT 'text',
  max_score integer NOT NULL DEFAULT 100,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assignments_submission_type_check CHECK (submission_type IN ('text','link','file','code'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text,
  file_url text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  score integer,
  feedback text,
  status text NOT NULL DEFAULT 'submitted',
  graded_by uuid,
  graded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, user_id),
  CONSTRAINT assignment_submissions_status_check CHECK (status IN ('submitted','graded','returned'))
);
GRANT SELECT, INSERT, UPDATE ON public.assignment_submissions TO authenticated;
GRANT ALL ON public.assignment_submissions TO service_role;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  watched_recording boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- Notifications / announcements / settings
-- =====================================================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  is_published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.system_settings TO anon, authenticated;
GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- RLS policies
-- =====================================================================
-- courses
CREATE POLICY "Anyone reads published courses" ON public.courses FOR SELECT TO anon, authenticated USING (is_published OR public.is_admin() OR public.teaches_course(auth.uid(), id));
CREATE POLICY "Admins manage courses" ON public.courses FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- course_instructors
CREATE POLICY "Anyone reads instructors" ON public.course_instructors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage instructors" ON public.course_instructors FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- modules
CREATE POLICY "Anyone reads published modules" ON public.modules FOR SELECT TO anon, authenticated
  USING ((is_published AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.is_published)) OR public.is_admin() OR public.teaches_course(auth.uid(), course_id));
CREATE POLICY "Admins manage modules" ON public.modules FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- lessons (catalogue metadata is public; gated content is fetched per-access in app + resources/recordings RLS)
CREATE POLICY "Anyone reads published lessons" ON public.lessons FOR SELECT TO anon, authenticated
  USING ((is_published AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.is_published)) OR public.is_admin() OR public.teaches_course(auth.uid(), course_id));
CREATE POLICY "Admins manage lessons" ON public.lessons FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- payment plans
CREATE POLICY "Anyone reads active plans" ON public.payment_plans FOR SELECT TO anon, authenticated USING ((is_active AND NOT is_archived) OR public.is_admin());
CREATE POLICY "Admins manage plans" ON public.payment_plans FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- enrollments
CREATE POLICY "Users read own enrollments" ON public.enrollments FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin() OR public.teaches_course(auth.uid(), course_id));
CREATE POLICY "Admins manage enrollments" ON public.enrollments FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- subscriptions
CREATE POLICY "Users read own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins manage subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- payments (writes only via server side)
CREATE POLICY "Users read own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());

-- live sessions
CREATE POLICY "Enrolled users read sessions" ON public.live_sessions FOR SELECT TO authenticated
  USING (public.has_course_access(auth.uid(), course_id));
CREATE POLICY "Admins manage sessions" ON public.live_sessions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Teachers update own sessions" ON public.live_sessions FOR UPDATE TO authenticated
  USING (public.teaches_course(auth.uid(), course_id)) WITH CHECK (public.teaches_course(auth.uid(), course_id));
CREATE POLICY "Teachers create sessions" ON public.live_sessions FOR INSERT TO authenticated
  WITH CHECK (public.teaches_course(auth.uid(), course_id));

-- session messages
CREATE POLICY "Participants read chat" ON public.session_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.live_sessions s WHERE s.id = session_id AND public.has_course_access(auth.uid(), s.course_id)));
CREATE POLICY "Participants send chat" ON public.session_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.live_sessions s WHERE s.id = session_id
      AND public.has_course_access(auth.uid(), s.course_id)
      AND (s.chat_locked = false OR public.teaches_course(auth.uid(), s.course_id) OR public.is_admin())));
CREATE POLICY "Teachers moderate chat" ON public.session_messages FOR DELETE TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.live_sessions s WHERE s.id = session_id AND public.teaches_course(auth.uid(), s.course_id)));

-- attendance
CREATE POLICY "Users read own attendance" ON public.attendance FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin() OR EXISTS (SELECT 1 FROM public.live_sessions s WHERE s.id = session_id AND public.teaches_course(auth.uid(), s.course_id)));
CREATE POLICY "Users record own attendance" ON public.attendance FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.live_sessions s WHERE s.id = session_id AND public.has_course_access(auth.uid(), s.course_id)));
CREATE POLICY "Users update own attendance" ON public.attendance FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- recordings
CREATE POLICY "Enrolled users read recordings" ON public.recordings FOR SELECT TO authenticated
  USING (public.has_course_access(auth.uid(), course_id));
CREATE POLICY "Admins manage recordings" ON public.recordings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Teachers manage course recordings" ON public.recordings FOR ALL TO authenticated
  USING (public.teaches_course(auth.uid(), course_id)) WITH CHECK (public.teaches_course(auth.uid(), course_id));

-- resources
CREATE POLICY "Access-gated resources read" ON public.resources FOR SELECT TO authenticated
  USING (is_public OR public.has_course_access(auth.uid(), course_id));
CREATE POLICY "Public resources anon read" ON public.resources FOR SELECT TO anon USING (is_public);
CREATE POLICY "Admins manage resources" ON public.resources FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Teachers manage course resources" ON public.resources FOR ALL TO authenticated
  USING (public.teaches_course(auth.uid(), course_id)) WITH CHECK (public.teaches_course(auth.uid(), course_id));

-- assignments
CREATE POLICY "Enrolled users read assignments" ON public.assignments FOR SELECT TO authenticated
  USING (is_published AND public.has_course_access(auth.uid(), course_id));
CREATE POLICY "Admins manage assignments" ON public.assignments FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Teachers manage course assignments" ON public.assignments FOR ALL TO authenticated
  USING (public.teaches_course(auth.uid(), course_id)) WITH CHECK (public.teaches_course(auth.uid(), course_id));

-- submissions
CREATE POLICY "Users read own submissions" ON public.assignment_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin() OR EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND public.teaches_course(auth.uid(), a.course_id)));
CREATE POLICY "Users create own submissions" ON public.assignment_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND public.has_course_access(auth.uid(), a.course_id)));
CREATE POLICY "Users update own submissions" ON public.assignment_submissions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Graders update submissions" ON public.assignment_submissions FOR UPDATE TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND public.teaches_course(auth.uid(), a.course_id)))
  WITH CHECK (public.is_admin() OR EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND public.teaches_course(auth.uid(), a.course_id)));

-- lesson progress
CREATE POLICY "Users read own progress" ON public.lesson_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin() OR public.teaches_course(auth.uid(), course_id));
CREATE POLICY "Users write own progress" ON public.lesson_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progress" ON public.lesson_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own progress" ON public.lesson_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- notifications
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- announcements
CREATE POLICY "Read announcements" ON public.announcements FOR SELECT TO authenticated
  USING (is_published AND (course_id IS NULL OR public.has_course_access(auth.uid(), course_id)));
CREATE POLICY "Admins manage announcements" ON public.announcements FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Teachers manage course announcements" ON public.announcements FOR ALL TO authenticated
  USING (course_id IS NOT NULL AND public.teaches_course(auth.uid(), course_id))
  WITH CHECK (course_id IS NOT NULL AND public.teaches_course(auth.uid(), course_id));

-- system settings
CREATE POLICY "Anyone reads settings" ON public.system_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage settings" ON public.system_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- user_roles: admins manage
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =====================================================================
-- updated_at triggers
-- =====================================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['courses','modules','lessons','payment_plans','enrollments','subscriptions','payments','live_sessions','attendance','recordings','resources','assignments','assignment_submissions','lesson_progress','announcements'] LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
  END LOOP;
END $$;

-- =====================================================================
-- Indexes
-- =====================================================================
CREATE INDEX idx_modules_course ON public.modules(course_id, sort_order);
CREATE INDEX idx_lessons_module ON public.lessons(module_id, sort_order);
CREATE INDEX idx_lessons_course ON public.lessons(course_id);
CREATE INDEX idx_sessions_course_start ON public.live_sessions(course_id, starts_at);
CREATE INDEX idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_progress_user_course ON public.lesson_progress(user_id, course_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read);
CREATE INDEX idx_messages_session ON public.session_messages(session_id, created_at);

-- realtime for classroom chat
ALTER TABLE public.session_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_messages;