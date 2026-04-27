-- Atomic, idempotent approval functions to prevent double-crediting
-- caused by rapid double-clicks or concurrent requests.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Approve a user registration (credits referral bonus exactly once)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.approve_user_registration(_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _referred_by_id uuid;
  _bonus numeric;
  _referrer_user_id uuid;
  _registration_fee numeric;
  _bonus_pct numeric;
  _updated_count int;
BEGIN
  -- Permission check
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve registrations';
  END IF;

  -- Atomic state transition: only flip if currently NOT active.
  -- If 0 rows updated, another request already processed this — safe no-op.
  UPDATE public.profiles
  SET registration_status = 'active'
  WHERE id = _profile_id
    AND registration_status <> 'active'
  RETURNING user_id, referred_by_id INTO _user_id, _referred_by_id;

  GET DIAGNOSTICS _updated_count = ROW_COUNT;

  IF _updated_count = 0 THEN
    -- Already approved — duplicate request. Return without crediting.
    RETURN jsonb_build_object('status', 'already_approved');
  END IF;

  -- Credit referral bonus (only reaches here on a real status transition)
  IF _referred_by_id IS NOT NULL THEN
    SELECT registration_fee, referral_bonus_percent
      INTO _registration_fee, _bonus_pct
    FROM public.admin_settings
    LIMIT 1;

    IF _registration_fee IS NOT NULL AND _bonus_pct IS NOT NULL THEN
      _bonus := (_registration_fee * _bonus_pct) / 100;

      SELECT user_id INTO _referrer_user_id
      FROM public.profiles
      WHERE id = _referred_by_id;

      IF _referrer_user_id IS NOT NULL AND _bonus > 0 THEN
        UPDATE public.profiles
        SET usdt_balance = usdt_balance + _bonus
        WHERE id = _referred_by_id;

        INSERT INTO public.transactions (user_id, amount, type, status)
        VALUES (_referrer_user_id, _bonus, 'referral_bonus', 'completed');
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object('status', 'approved', 'user_id', _user_id);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Approve a task completion (credits reward exactly once)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.approve_task_completion(_completion_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _task_id uuid;
  _reward numeric;
  _updated_count int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve task completions';
  END IF;

  -- Atomic state transition
  UPDATE public.task_completions
  SET status = 'approved', reviewed_at = now()
  WHERE id = _completion_id
    AND status = 'pending'
  RETURNING user_id, task_id INTO _user_id, _task_id;

  GET DIAGNOSTICS _updated_count = ROW_COUNT;

  IF _updated_count = 0 THEN
    RETURN jsonb_build_object('status', 'already_processed');
  END IF;

  SELECT reward_amount INTO _reward FROM public.tasks WHERE id = _task_id;

  IF _reward IS NOT NULL AND _reward > 0 THEN
    UPDATE public.profiles
    SET usdt_balance = usdt_balance + _reward
    WHERE user_id = _user_id;

    INSERT INTO public.transactions (user_id, amount, type, status)
    VALUES (_user_id, _reward, 'reward', 'completed');
  END IF;

  RETURN jsonb_build_object(
    'status', 'approved',
    'user_id', _user_id,
    'reward', _reward
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Reject a task completion (idempotent state transition only)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reject_task_completion(_completion_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _updated_count int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can reject task completions';
  END IF;

  UPDATE public.task_completions
  SET status = 'rejected', reviewed_at = now()
  WHERE id = _completion_id
    AND status = 'pending'
  RETURNING user_id INTO _user_id;

  GET DIAGNOSTICS _updated_count = ROW_COUNT;

  IF _updated_count = 0 THEN
    RETURN jsonb_build_object('status', 'already_processed');
  END IF;

  RETURN jsonb_build_object('status', 'rejected', 'user_id', _user_id);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Approve a withdrawal (debits balance exactly once)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.approve_withdrawal(_transaction_id uuid, _tx_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _amount numeric;
  _updated_count int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve withdrawals';
  END IF;

  UPDATE public.transactions
  SET status = 'completed', tx_hash = COALESCE(NULLIF(_tx_hash, ''), tx_hash)
  WHERE id = _transaction_id
    AND status = 'pending'
    AND type = 'withdrawal'
  RETURNING user_id, amount INTO _user_id, _amount;

  GET DIAGNOSTICS _updated_count = ROW_COUNT;

  IF _updated_count = 0 THEN
    RETURN jsonb_build_object('status', 'already_processed');
  END IF;

  -- Debit the user's balance (clamped at 0)
  UPDATE public.profiles
  SET usdt_balance = GREATEST(0, usdt_balance - _amount)
  WHERE user_id = _user_id;

  RETURN jsonb_build_object(
    'status', 'approved',
    'user_id', _user_id,
    'amount', _amount
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Reject a withdrawal (idempotent state transition only)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reject_withdrawal(_transaction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _amount numeric;
  _updated_count int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can reject withdrawals';
  END IF;

  UPDATE public.transactions
  SET status = 'rejected'
  WHERE id = _transaction_id
    AND status = 'pending'
    AND type = 'withdrawal'
  RETURNING user_id, amount INTO _user_id, _amount;

  GET DIAGNOSTICS _updated_count = ROW_COUNT;

  IF _updated_count = 0 THEN
    RETURN jsonb_build_object('status', 'already_processed');
  END IF;

  RETURN jsonb_build_object(
    'status', 'rejected',
    'user_id', _user_id,
    'amount', _amount
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Reject a user registration (idempotent state transition only)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reject_user_registration(_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _updated_count int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can reject registrations';
  END IF;

  UPDATE public.profiles
  SET registration_status = 'rejected'
  WHERE id = _profile_id
    AND registration_status = 'pending'
  RETURNING user_id INTO _user_id;

  GET DIAGNOSTICS _updated_count = ROW_COUNT;

  IF _updated_count = 0 THEN
    RETURN jsonb_build_object('status', 'already_processed');
  END IF;

  RETURN jsonb_build_object('status', 'rejected', 'user_id', _user_id);
END;
$$;