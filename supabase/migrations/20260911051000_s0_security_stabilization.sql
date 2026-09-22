-- S0 security stabilization.
-- Closes the known RLS gaps and removes implicit operational roles for new users.

-- New auth users are provisioned as pending (profile without an operational role).
-- An administrator/invitation workflow must assign role_id explicitly.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role_id, first_name, last_name)
  VALUES (
    NEW.id,
    NULL,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Every Data API table must have explicit RLS coverage.
ALTER TABLE public.agencies_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agencies_users_select_scoped" ON public.agencies_users;
CREATE POLICY "agencies_users_select_scoped"
ON public.agencies_users FOR SELECT TO authenticated
USING (
  public.current_user_role() = 'admin'
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "agencies_users_admin_write" ON public.agencies_users;
CREATE POLICY "agencies_users_admin_write"
ON public.agencies_users FOR ALL TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "routes_select_operational" ON public.routes;
CREATE POLICY "routes_select_operational"
ON public.routes FOR SELECT TO authenticated
USING (public.current_user_role() IN ('admin', 'agency', 'operator'));

DROP POLICY IF EXISTS "routes_admin_write" ON public.routes;
CREATE POLICY "routes_admin_write"
ON public.routes FOR ALL TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "tours_select_operational" ON public.tours;
CREATE POLICY "tours_select_operational"
ON public.tours FOR SELECT TO authenticated
USING (public.current_user_role() IN ('admin', 'agency', 'operator'));

DROP POLICY IF EXISTS "tours_admin_write" ON public.tours;
CREATE POLICY "tours_admin_write"
ON public.tours FOR ALL TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

-- Agencies may browse the shared catalog. Operators only see/write their own fleet.
DROP POLICY IF EXISTS "vessels_select_authenticated" ON public.vessels;
CREATE POLICY "vessels_select_authenticated"
ON public.vessels FOR SELECT TO authenticated
USING (
  public.current_user_role() IN ('admin', 'agency')
  OR (public.current_user_role() = 'operator' AND owner_id = auth.uid())
);

DROP POLICY IF EXISTS "availability_select_authenticated" ON public.availability;
CREATE POLICY "availability_select_authenticated"
ON public.availability FOR SELECT TO authenticated
USING (
  public.current_user_role() IN ('admin', 'agency')
  OR (
    public.current_user_role() = 'operator'
    AND EXISTS (
      SELECT 1
      FROM public.vessels v
      WHERE v.id = availability.vessel_id
        AND v.owner_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "availability_admin_or_operator_write" ON public.availability;
CREATE POLICY "availability_admin_or_operator_write"
ON public.availability FOR ALL TO authenticated
USING (
  public.current_user_role() = 'admin'
  OR (
    public.current_user_role() = 'operator'
    AND EXISTS (
      SELECT 1
      FROM public.vessels v
      WHERE v.id = availability.vessel_id
        AND v.owner_id = auth.uid()
    )
  )
)
WITH CHECK (
  public.current_user_role() = 'admin'
  OR (
    public.current_user_role() = 'operator'
    AND EXISTS (
      SELECT 1
      FROM public.vessels v
      WHERE v.id = availability.vessel_id
        AND v.owner_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "reservations_select_role_scoped" ON public.reservations;
CREATE POLICY "reservations_select_role_scoped"
ON public.reservations FOR SELECT TO authenticated
USING (
  public.current_user_role() = 'admin'
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.agencies_users au
    WHERE au.agency_id = reservations.agency_id
      AND au.user_id = auth.uid()
  )
  OR (
    public.current_user_role() = 'operator'
    AND EXISTS (
      SELECT 1
      FROM public.availability a
      JOIN public.vessels v ON v.id = a.vessel_id
      WHERE a.id = reservations.availability_id
        AND v.owner_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "vouchers_select_role_scoped" ON public.vouchers;
CREATE POLICY "vouchers_select_role_scoped"
ON public.vouchers FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.reservations r
    WHERE r.id = vouchers.reservation_id
      AND (
        public.current_user_role() = 'admin'
        OR r.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.agencies_users au
          WHERE au.agency_id = r.agency_id
            AND au.user_id = auth.uid()
        )
        OR (
          public.current_user_role() = 'operator'
          AND EXISTS (
            SELECT 1
            FROM public.availability a
            JOIN public.vessels v ON v.id = a.vessel_id
            WHERE a.id = r.availability_id
              AND v.owner_id = auth.uid()
          )
        )
      )
  )
);

-- RPC ownership checks are mandatory because SECURITY DEFINER bypasses caller RLS.
CREATE OR REPLACE FUNCTION public.cancel_reservation(p_reservation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_role TEXT;
  v_res public.reservations%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  SELECT public.current_user_role() INTO v_role;
  SELECT * INTO v_res FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'RESERVATION_NOT_FOUND'; END IF;
  IF v_res.status = 'cancelled' THEN RETURN TRUE; END IF;

  IF v_role = 'admin' THEN
    NULL;
  ELSIF v_role = 'operator' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.availability a
      JOIN public.vessels v ON v.id = a.vessel_id
      WHERE a.id = v_res.availability_id
        AND v.owner_id = v_user
    ) THEN
      RAISE EXCEPTION 'NOT_ALLOWED';
    END IF;
  ELSIF v_res.user_id = v_user AND EXISTS (
    SELECT 1 FROM public.agencies_users au
    WHERE au.agency_id = v_res.agency_id
      AND au.user_id = v_user
  ) THEN
    NULL;
  ELSE
    RAISE EXCEPTION 'NOT_ALLOWED';
  END IF;

  UPDATE public.reservations
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_reservation_id;

  UPDATE public.availability
  SET available_seats = LEAST(total_seats, available_seats + v_res.passenger_count), updated_at = NOW()
  WHERE id = v_res.availability_id;

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_value, new_value)
  VALUES (
    v_user,
    'reservation.cancelled',
    'reservations',
    p_reservation_id,
    jsonb_build_object('status', v_res.status),
    jsonb_build_object('status', 'cancelled', 'passenger_count', v_res.passenger_count)
  );

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_availability_seats(p_availability_id UUID, p_available_seats INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_role TEXT;
  v_availability public.availability%ROWTYPE;
  v_booked INT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  SELECT public.current_user_role() INTO v_role;
  IF v_role NOT IN ('admin', 'operator') THEN RAISE EXCEPTION 'ROLE_NOT_ALLOWED'; END IF;
  IF p_available_seats IS NULL OR p_available_seats < 0 THEN RAISE EXCEPTION 'INVALID_SEATS'; END IF;

  SELECT * INTO v_availability
  FROM public.availability
  WHERE id = p_availability_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'AVAILABILITY_NOT_FOUND'; END IF;

  IF v_role = 'operator' AND NOT EXISTS (
    SELECT 1
    FROM public.vessels v
    WHERE v.id = v_availability.vessel_id
      AND v.owner_id = v_user
  ) THEN
    RAISE EXCEPTION 'NOT_ALLOWED';
  END IF;

  SELECT COALESCE(SUM(passenger_count), 0)::INT INTO v_booked
  FROM public.reservations
  WHERE availability_id = p_availability_id
    AND status <> 'cancelled';

  IF p_available_seats > v_availability.total_seats - v_booked THEN
    RAISE EXCEPTION 'SEAT_CAPACITY_CONFLICT';
  END IF;

  UPDATE public.availability
  SET available_seats = p_available_seats,
      status = CASE WHEN p_available_seats = 0 THEN 'full' ELSE 'active' END,
      updated_at = NOW()
  WHERE id = p_availability_id;

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_value, new_value)
  VALUES (
    v_user,
    'availability.seats.updated',
    'availability',
    p_availability_id,
    jsonb_build_object('available_seats', v_availability.available_seats),
    jsonb_build_object('available_seats', p_available_seats)
  );

  RETURN p_available_seats;
END;
$$;
