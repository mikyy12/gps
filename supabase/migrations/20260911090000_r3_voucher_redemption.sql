-- R3 voucher redemption migration.

-- ============================================================
-- 1. Voucher redemption state
-- ============================================================

ALTER TABLE public.vouchers
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'issued',
  ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS redeemed_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.vouchers
  DROP CONSTRAINT IF EXISTS vouchers_status_check;

ALTER TABLE public.vouchers
  ADD CONSTRAINT vouchers_status_check
  CHECK (status IN ('issued', 'redeemed', 'revoked', 'expired'));

-- ============================================================
-- 2. Append-only redemption record
-- ============================================================

CREATE TABLE IF NOT EXISTS public.voucher_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id),
  redeemed_by UUID NOT NULL REFERENCES public.profiles(id),
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT voucher_redemptions_voucher_unique
    UNIQUE (voucher_id)
);

ALTER TABLE public.voucher_redemptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_reservation_id
  ON public.voucher_redemptions(reservation_id);

CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_redeemed_by
  ON public.voucher_redemptions(redeemed_by);


-- ============================================================
-- 3. Voucher mutation hardening
-- ============================================================

DROP POLICY IF EXISTS "vouchers_insert_admin" ON public.vouchers;
DROP POLICY IF EXISTS "vouchers_update_admin" ON public.vouchers;
DROP POLICY IF EXISTS "vouchers_delete_admin" ON public.vouchers;
DROP POLICY IF EXISTS "vouchers_admin_write" ON public.vouchers;

-- ============================================================
-- 4. Public verification remains read-only
-- ============================================================

DROP FUNCTION IF EXISTS public.verify_voucher(TEXT);

CREATE OR REPLACE FUNCTION public.verify_voucher(p_token TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  reservation_id UUID,
  voucher_id UUID,
  lead_passenger_name TEXT,
  passenger_count INT,
  vessel_name TEXT,
  route_name TEXT,
  departure_date DATE,
  departure_time TIME,
  reservation_status TEXT,
  voucher_status TEXT,
  redeemed_at TIMESTAMPTZ,
  agency_name TEXT,
  issued_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (
      r.status <> 'cancelled'
      AND v.status NOT IN ('revoked', 'expired')
    ) AS valid,
    r.id,
    v.id,
    r.lead_passenger_name,
    r.passenger_count,
    ve.name,
    ro.name,
    a.date,
    a.departure_time,
    r.status,
    v.status,
    v.redeemed_at,
    ag.name,
    v.issued_at
  FROM public.vouchers v
  JOIN public.reservations r
    ON r.id = v.reservation_id
  JOIN public.availability a
    ON a.id = r.availability_id
  LEFT JOIN public.vessels ve
    ON ve.id = a.vessel_id
  LEFT JOIN public.routes ro
    ON ro.id = a.route_id
  LEFT JOIN public.agencies ag
    ON ag.id = r.agency_id
  WHERE v.qr_code_token = BTRIM(p_token)
    AND r.status <> 'cancelled'
    AND v.status NOT IN ('revoked', 'expired')
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.verify_voucher(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_voucher(TEXT) TO anon, authenticated;

-- ============================================================
-- 5. Authoritative atomic redemption RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.redeem_voucher(p_token TEXT)
RETURNS TABLE (
  redeemed BOOLEAN,
  voucher_id UUID,
  reservation_id UUID,
  voucher_status TEXT,
  redeemed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_role TEXT;
  v_voucher public.vouchers%ROWTYPE;
  v_reservation public.reservations%ROWTYPE;
  v_availability public.availability%ROWTYPE;
  v_redeemed_at TIMESTAMPTZ;
BEGIN
  -- ----------------------------------------------------------
  -- Authentication
  -- ----------------------------------------------------------

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  -- ----------------------------------------------------------
  -- Role authorization
  -- ----------------------------------------------------------

  SELECT public.current_user_role()
    INTO v_role;

  IF v_role NOT IN ('admin', 'operator') THEN
    RAISE EXCEPTION 'ROLE_NOT_ALLOWED';
  END IF;

  -- ----------------------------------------------------------
  -- Lock the voucher row.
  --
  -- This is the critical anti-double-redemption boundary.
  -- Concurrent redemption attempts for the same voucher serialize.
  -- ----------------------------------------------------------

  SELECT *
    INTO v_voucher
  FROM public.vouchers
  WHERE qr_code_token = BTRIM(p_token)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VOUCHER_NOT_FOUND';
  END IF;

  -- ----------------------------------------------------------
  -- Voucher lifecycle validation
  -- ----------------------------------------------------------

  IF v_voucher.status <> 'issued' THEN
    RAISE EXCEPTION 'VOUCHER_NOT_REDEEMABLE';
  END IF;

  -- ----------------------------------------------------------
  -- Load reservation
  -- ----------------------------------------------------------

  SELECT *
    INTO v_reservation
  FROM public.reservations
  WHERE id = v_voucher.reservation_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RESERVATION_NOT_FOUND';
  END IF;

  IF v_reservation.status = 'cancelled' THEN
    RAISE EXCEPTION 'RESERVATION_NOT_REDEEMABLE';
  END IF;

  -- ----------------------------------------------------------
  -- Load availability
  -- ----------------------------------------------------------

  SELECT *
    INTO v_availability
  FROM public.availability
  WHERE id = v_reservation.availability_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'AVAILABILITY_NOT_FOUND';
  END IF;

  -- ----------------------------------------------------------
  -- Operator ownership boundary
  --
  -- Admin: can redeem globally.
  -- Operator: only their own vessel's vouchers.
  -- Agency: rejected above.
  -- ----------------------------------------------------------

  IF v_role = 'operator'
     AND NOT EXISTS (
       SELECT 1
       FROM public.vessels ve
       WHERE ve.id = v_availability.vessel_id
         AND ve.owner_id = v_user
     )
  THEN
    RAISE EXCEPTION 'OPERATOR_NOT_ALLOWED';
  END IF;

  -- ----------------------------------------------------------
  -- Atomic state transition
  -- ----------------------------------------------------------

  v_redeemed_at := NOW();

  UPDATE public.vouchers
  SET
    status = 'redeemed',
    redeemed_at = v_redeemed_at,
    redeemed_by = v_user
  WHERE id = v_voucher.id
    AND status = 'issued';

  IF NOT FOUND THEN
    -- Defensive guard in case the voucher state changed between
    -- validation and update.
    RAISE EXCEPTION 'VOUCHER_ALREADY_REDEEMED';
  END IF;

  -- ----------------------------------------------------------
  -- Append redemption record.
  --
  -- UNIQUE(voucher_id) provides a second database-level guard.
  -- ----------------------------------------------------------

  INSERT INTO public.voucher_redemptions (
    voucher_id,
    reservation_id,
    redeemed_by,
    redeemed_at
  )
  VALUES (
    v_voucher.id,
    v_reservation.id,
    v_user,
    v_redeemed_at
  );

  -- ----------------------------------------------------------
  -- Audit
  -- ----------------------------------------------------------

  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_value,
    new_value
  )
  VALUES (
    v_user,
    'voucher.redeemed',
    'vouchers',
    v_voucher.id,
    jsonb_build_object(
      'status', 'issued'
    ),
    jsonb_build_object(
      'status', 'redeemed',
      'reservation_id', v_reservation.id,
      'redeemed_by', v_user,
      'redeemed_at', v_redeemed_at
    )
  );

  RETURN QUERY
  SELECT
    TRUE,
    v_voucher.id,
    v_reservation.id,
    'redeemed'::TEXT,
    v_redeemed_at;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_voucher(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_voucher(TEXT) TO authenticated;

-- ============================================================
-- 6. Explicitly keep voucher verification separate from redemption
-- ============================================================

COMMENT ON FUNCTION public.verify_voucher(TEXT)
IS 'Read-only public voucher verification. Never consumes a voucher.';

COMMENT ON FUNCTION public.redeem_voucher(TEXT)
IS 'Authoritative authenticated voucher redemption. Atomic, role-scoped and audited.';
