-- 1. Add external_completions column
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS external_completions integer NOT NULL DEFAULT 0;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_external_completions_nonneg CHECK (external_completions >= 0);

-- 2. Update enforce_task_capacity to include external_completions
CREATE OR REPLACE FUNCTION public.enforce_task_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _max int;
  _current int;
  _external int;
  _is_active boolean;
BEGIN
  SELECT max_completions, is_active, COALESCE(external_completions, 0)
    INTO _max, _is_active, _external
  FROM public.tasks WHERE id = NEW.task_id;

  IF _is_active = false THEN
    RAISE EXCEPTION 'This task is closed and no longer accepting submissions.';
  END IF;

  IF _max IS NOT NULL THEN
    SELECT count(*) INTO _current
    FROM public.task_completions
    WHERE task_id = NEW.task_id AND status <> 'rejected';

    IF (_current + _external) >= _max THEN
      RAISE EXCEPTION 'This task has reached its maximum number of submissions.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Update auto_close_task_when_full to include external_completions
CREATE OR REPLACE FUNCTION public.auto_close_task_when_full()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _max int;
  _current int;
  _external int;
  _is_active boolean;
BEGIN
  SELECT max_completions, is_active, COALESCE(external_completions, 0)
    INTO _max, _is_active, _external
  FROM public.tasks WHERE id = NEW.task_id;

  IF _max IS NOT NULL AND _is_active = true THEN
    SELECT count(*) INTO _current
    FROM public.task_completions
    WHERE task_id = NEW.task_id AND status <> 'rejected';

    IF (_current + _external) >= _max THEN
      UPDATE public.tasks SET is_active = false WHERE id = NEW.task_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. New trigger: when admin updates external_completions or max_completions,
--    auto-close the task if combined total now meets or exceeds the cap.
CREATE OR REPLACE FUNCTION public.auto_close_task_on_external_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current int;
BEGIN
  IF NEW.is_active = true
     AND NEW.max_completions IS NOT NULL
     AND (
       COALESCE(NEW.external_completions, 0) <> COALESCE(OLD.external_completions, 0)
       OR COALESCE(NEW.max_completions, -1) <> COALESCE(OLD.max_completions, -1)
     )
  THEN
    SELECT count(*) INTO _current
    FROM public.task_completions
    WHERE task_id = NEW.id AND status <> 'rejected';

    IF (_current + COALESCE(NEW.external_completions, 0)) >= NEW.max_completions THEN
      NEW.is_active := false;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_close_task_on_external_update ON public.tasks;
CREATE TRIGGER trg_auto_close_task_on_external_update
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.auto_close_task_on_external_update();