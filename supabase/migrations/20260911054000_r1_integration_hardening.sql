-- R1 integration hardening.
-- These guards close privilege-escalation and reservation-bypass paths that
-- contract-only tests cannot prove at runtime.

-- A user may edit profile fields, but changing role_id is privileged.
-- service_role remains allowed for controlled provisioning/bootstrap tasks.
CREATE OR REPLACE FUNCTION public.guard_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role_id IS DISTINCT FROM OLD.role_id THEN
    IF COALESCE(auth.role(), '') <> 'service_role'
       AND COALESCE(public.current_user_role(), '') <> 'admin' THEN
      RAISE EXCEPTION 'ROLE_CHANGE_NOT_ALLOWED';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_role_change ON public.profiles;
CREATE TRIGGER guard_profile_role_change
  BEFORE UPDATE OF role_id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_role_change();

-- Operational role provisioning is explicit and auditable.
CREATE OR REPLACE FUNCTION public.assign_user_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_role_id UUID;
  v_previous_role UUID;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF public.current_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED';
  END IF;

  SELECT id INTO v_role_id
  FROM public.roles
  WHERE name = p_role
    AND name IN ('admin', 'agency', 'operator')
  LIMIT 1;

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_ROLE';
  END IF;

  SELECT role_id INTO v_previous_role
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROFILE_NOT_FOUND';
  END IF;

  UPDATE public.profiles
  SET role_id = v_role_id,
      updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_value, new_value)
  VALUES (
    v_actor,
    'profile.role.assigned',
    'profiles',
    p_user_id,
    jsonb_build_object('role_id', v_previous_role),
    jsonb_build_object('role_id', v_role_id, 'role', p_role)
  );

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_user_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT) TO authenticated;

-- Reservations must be created through create_reservation(). Direct inserts can
-- bypass seat locking/decrement and agency ownership validation, so no table
-- INSERT policy is left for authenticated callers.
DROP POLICY IF EXISTS "reservations_insert_authenticated" ON public.reservations;
