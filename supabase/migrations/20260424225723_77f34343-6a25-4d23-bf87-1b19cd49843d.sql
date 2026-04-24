-- Trigger 1: Block new task_completions if capacity reached
CREATE OR REPLACE FUNCTION public.enforce_task_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _max int;
  _current int;
  _is_active boolean;
BEGIN
  SELECT max_completions, is_active INTO _max, _is_active
  FROM public.tasks WHERE id = NEW.task_id;

  IF _is_active = false THEN
    RAISE EXCEPTION 'This task is closed and no longer accepting submissions.';
  END IF;

  IF _max IS NOT NULL THEN
    SELECT count(*) INTO _current
    FROM public.task_completions
    WHERE task_id = NEW.task_id AND status <> 'rejected';

    IF _current >= _max THEN
      RAISE EXCEPTION 'This task has reached its maximum number of submissions.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_task_capacity ON public.task_completions;
CREATE TRIGGER trg_enforce_task_capacity
  BEFORE INSERT ON public.task_completions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_task_capacity();

-- Trigger 2: Auto-close task when capacity reached after a successful insert
CREATE OR REPLACE FUNCTION public.auto_close_task_when_full()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _max int;
  _current int;
  _is_active boolean;
BEGIN
  SELECT max_completions, is_active INTO _max, _is_active
  FROM public.tasks WHERE id = NEW.task_id;

  IF _max IS NOT NULL AND _is_active = true THEN
    SELECT count(*) INTO _current
    FROM public.task_completions
    WHERE task_id = NEW.task_id AND status <> 'rejected';

    IF _current >= _max THEN
      UPDATE public.tasks SET is_active = false WHERE id = NEW.task_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_close_task_when_full ON public.task_completions;
CREATE TRIGGER trg_auto_close_task_when_full
  AFTER INSERT ON public.task_completions
  FOR EACH ROW EXECUTE FUNCTION public.auto_close_task_when_full();

-- Trigger 3: Broadcast notification when a task transitions from active -> inactive
CREATE OR REPLACE FUNCTION public.notify_task_closed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_active = true AND NEW.is_active = false THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, email_status)
    SELECT
      p.user_id,
      'task_closed',
      'Task closed: ' || NEW.title,
      'The task "' || NEW.title || '" is no longer accepting submissions. Check the Tasks page for other available opportunities.',
      '/tasks',
      'pending_domain_setup'
    FROM public.profiles p
    WHERE p.registration_status = 'active';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_task_closed ON public.tasks;
CREATE TRIGGER trg_notify_task_closed
  AFTER UPDATE OF is_active ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_task_closed();