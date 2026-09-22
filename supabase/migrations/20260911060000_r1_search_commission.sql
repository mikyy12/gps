-- R1 functional stabilization: server-side availability search and agency commission.

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.1500;

ALTER TABLE public.agencies
  DROP CONSTRAINT IF EXISTS agencies_commission_rate_check;
ALTER TABLE public.agencies
  ADD CONSTRAINT agencies_commission_rate_check
  CHECK (commission_rate >= 0 AND commission_rate <= 1);

-- Search happens in PostgreSQL before LIMIT. SECURITY INVOKER is intentional:
-- all table RLS policies remain authoritative for the caller.
CREATE OR REPLACE FUNCTION public.search_availability(
  p_date DATE DEFAULT NULL,
  p_query TEXT DEFAULT NULL,
  p_passengers INT DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  date DATE,
  departure_time TIME,
  total_seats INT,
  available_seats INT,
  status TEXT,
  vessel_name TEXT,
  route_name TEXT,
  origin TEXT,
  destination TEXT,
  duration_minutes INT,
  tour_name TEXT,
  tour_description TEXT,
  base_price NUMERIC
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.date,
    a.departure_time,
    a.total_seats,
    a.available_seats,
    a.status,
    v.name AS vessel_name,
    r.name AS route_name,
    r.origin,
    r.destination,
    r.duration_minutes,
    t.name AS tour_name,
    t.description AS tour_description,
    t.base_price
  FROM public.availability a
  JOIN public.vessels v ON v.id = a.vessel_id
  LEFT JOIN public.routes r ON r.id = a.route_id
  LEFT JOIN public.tours t ON t.id = a.tour_id
  WHERE a.status = 'active'
    AND a.available_seats >= GREATEST(COALESCE(p_passengers, 1), 1)
    AND (p_date IS NULL OR a.date = p_date)
    AND (
      NULLIF(BTRIM(p_query), '') IS NULL
      OR CONCAT_WS(' ', r.name, r.origin, r.destination) ILIKE '%' || BTRIM(p_query) || '%'
    )
  ORDER BY a.date ASC, a.departure_time ASC
  LIMIT 50;
$$;

REVOKE ALL ON FUNCTION public.search_availability(DATE, TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_availability(DATE, TEXT, INT) TO authenticated;

-- Commission is an agency-domain setting, not a UI constant.
CREATE OR REPLACE FUNCTION public.create_reservation(
  p_availability_id UUID,
  p_agency_id UUID,
  p_passenger_count INT,
  p_lead_passenger_name TEXT,
  p_lead_passenger_document TEXT
)
RETURNS TABLE (
  reservation_id UUID,
  voucher_token TEXT,
  available_seats INT,
  total_price NUMERIC,
  commission_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_role TEXT;
  v_availability public.availability%ROWTYPE;
  v_tour_price NUMERIC(10,2);
  v_commission_rate NUMERIC(5,4);
  v_total NUMERIC(10,2);
  v_commission NUMERIC(10,2);
  v_reservation UUID;
  v_token TEXT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF p_passenger_count IS NULL OR p_passenger_count < 1 THEN RAISE EXCEPTION 'INVALID_PASSENGER_COUNT'; END IF;
  IF p_lead_passenger_name IS NULL OR length(trim(p_lead_passenger_name)) < 2 THEN RAISE EXCEPTION 'INVALID_LEAD_PASSENGER'; END IF;

  SELECT public.current_user_role() INTO v_role;
  IF v_role NOT IN ('admin', 'agency') THEN RAISE EXCEPTION 'ROLE_NOT_ALLOWED'; END IF;

  IF v_role = 'agency' AND NOT EXISTS (
    SELECT 1
    FROM public.agencies_users au
    WHERE au.agency_id = p_agency_id
      AND au.user_id = v_user
  ) THEN
    RAISE EXCEPTION 'AGENCY_NOT_ALLOWED';
  END IF;

  SELECT commission_rate INTO v_commission_rate
  FROM public.agencies
  WHERE id = p_agency_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'AGENCY_NOT_FOUND'; END IF;

  SELECT * INTO v_availability
  FROM public.availability
  WHERE id = p_availability_id
  FOR UPDATE;

  IF NOT FOUND OR v_availability.status <> 'active' THEN RAISE EXCEPTION 'AVAILABILITY_NOT_FOUND'; END IF;
  IF v_availability.date < CURRENT_DATE THEN RAISE EXCEPTION 'DATE_IN_PAST'; END IF;
  IF v_availability.available_seats < p_passenger_count THEN RAISE EXCEPTION 'INSUFFICIENT_SEATS'; END IF;

  SELECT base_price INTO v_tour_price
  FROM public.tours
  WHERE id = v_availability.tour_id;
  IF v_tour_price IS NULL THEN RAISE EXCEPTION 'PRICE_NOT_FOUND'; END IF;

  v_total := v_tour_price * p_passenger_count;
  v_commission := round(v_total * v_commission_rate, 2);

  UPDATE public.availability AS a
  SET available_seats = a.available_seats - p_passenger_count,
      updated_at = NOW()
  WHERE a.id = p_availability_id;

  INSERT INTO public.reservations (
    availability_id,
    agency_id,
    user_id,
    status,
    total_price,
    commission_amount,
    passenger_count,
    lead_passenger_name,
    lead_passenger_document,
    expires_at
  ) VALUES (
    p_availability_id,
    p_agency_id,
    v_user,
    'confirmed',
    v_total,
    v_commission,
    p_passenger_count,
    trim(p_lead_passenger_name),
    NULLIF(trim(p_lead_passenger_document), ''),
    NULL
  ) RETURNING id INTO v_reservation;

  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  INSERT INTO public.vouchers (reservation_id, qr_code_token)
  VALUES (v_reservation, v_token);

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_value)
  VALUES (
    v_user,
    'reservation.created',
    'reservations',
    v_reservation,
    jsonb_build_object(
      'availability_id', p_availability_id,
      'passenger_count', p_passenger_count,
      'total_price', v_total,
      'commission_rate', v_commission_rate,
      'commission_amount', v_commission
    )
  );

  RETURN QUERY
  SELECT
    v_reservation,
    v_token,
    v_availability.available_seats - p_passenger_count,
    v_total,
    v_commission;
END;
$$;

REVOKE ALL ON FUNCTION public.create_reservation(UUID, UUID, INT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_reservation(UUID, UUID, INT, TEXT, TEXT) TO authenticated;
