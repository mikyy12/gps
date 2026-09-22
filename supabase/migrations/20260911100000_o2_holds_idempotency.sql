-- O2/C3.1: expiring reservation holds and PostgreSQL idempotency.
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS idempotency_key TEXT, ADD COLUMN IF NOT EXISTS request_fingerprint TEXT;
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check CHECK (status IN ('pending','held','confirmed','completed','cancelled','expired'));
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_user_idempotency_key ON public.reservations(user_id,idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_active_holds ON public.reservations(availability_id,expires_at) WHERE status='held';
CREATE OR REPLACE FUNCTION public.release_expired_holds(p_availability_id UUID) RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_released INT:=0; v_hold RECORD;
BEGIN
 FOR v_hold IN SELECT id,passenger_count FROM public.reservations WHERE availability_id=p_availability_id AND status='held' AND expires_at IS NOT NULL AND expires_at<=NOW() FOR UPDATE LOOP
  UPDATE public.reservations SET status='expired',updated_at=NOW() WHERE id=v_hold.id;
  UPDATE public.availability SET available_seats=LEAST(total_seats,available_seats+v_hold.passenger_count),updated_at=NOW() WHERE id=p_availability_id;
  INSERT INTO public.audit_logs(user_id,action,table_name,record_id,old_value,new_value) VALUES(NULL,'reservation.expired','reservations',v_hold.id,jsonb_build_object('status','held','passenger_count',v_hold.passenger_count),jsonb_build_object('status','expired','availability_id',p_availability_id));
  v_released:=v_released+1;
 END LOOP; RETURN v_released;
END;
$$;
REVOKE ALL ON FUNCTION public.release_expired_holds(UUID) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.create_reservation_hold(p_availability_id UUID,p_agency_id UUID,p_passenger_count INT,p_lead_passenger_name TEXT,p_lead_passenger_document TEXT,p_idempotency_key TEXT,p_hold_seconds INT DEFAULT 900)
RETURNS TABLE(reservation_id UUID,reservation_status TEXT,expires_at TIMESTAMPTZ,available_seats INT,total_price NUMERIC,commission_amount NUMERIC,reused BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user UUID:=auth.uid(); v_role TEXT; v_availability public.availability%ROWTYPE; v_existing public.reservations%ROWTYPE; v_tour_price NUMERIC(10,2); v_commission_rate NUMERIC(5,4); v_total NUMERIC(10,2); v_commission NUMERIC(10,2); v_fingerprint TEXT; v_reservation UUID; v_expires_at TIMESTAMPTZ;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 IF p_idempotency_key IS NULL OR length(BTRIM(p_idempotency_key))<8 OR length(BTRIM(p_idempotency_key))>128 THEN RAISE EXCEPTION 'INVALID_IDEMPOTENCY_KEY'; END IF;
 IF p_passenger_count IS NULL OR p_passenger_count<1 THEN RAISE EXCEPTION 'INVALID_PASSENGER_COUNT'; END IF;
 IF p_lead_passenger_name IS NULL OR length(BTRIM(p_lead_passenger_name))<2 THEN RAISE EXCEPTION 'INVALID_LEAD_PASSENGER'; END IF;
 IF p_hold_seconds IS NULL OR p_hold_seconds<60 OR p_hold_seconds>86400 THEN RAISE EXCEPTION 'INVALID_HOLD_DURATION'; END IF;
 SELECT public.current_user_role() INTO v_role;
 IF v_role NOT IN ('admin','agency') THEN RAISE EXCEPTION 'ROLE_NOT_ALLOWED'; END IF;
 IF v_role='agency' AND NOT EXISTS(SELECT 1 FROM public.agencies_users au WHERE au.agency_id=p_agency_id AND au.user_id=v_user) THEN RAISE EXCEPTION 'AGENCY_NOT_ALLOWED'; END IF;
 v_fingerprint:=md5(CONCAT_WS('|',p_availability_id::TEXT,p_agency_id::TEXT,p_passenger_count::TEXT,BTRIM(p_lead_passenger_name),NULLIF(BTRIM(p_lead_passenger_document),'')));
 SELECT * INTO v_availability FROM public.availability WHERE id=p_availability_id FOR UPDATE;
 IF NOT FOUND OR v_availability.status<>'active' THEN RAISE EXCEPTION 'AVAILABILITY_NOT_FOUND'; END IF;
 IF v_availability.date<CURRENT_DATE THEN RAISE EXCEPTION 'DATE_IN_PAST'; END IF;
 PERFORM public.release_expired_holds(p_availability_id);
 SELECT * INTO v_availability FROM public.availability WHERE id=p_availability_id FOR UPDATE;
 SELECT * INTO v_existing FROM public.reservations WHERE user_id=v_user AND idempotency_key=BTRIM(p_idempotency_key) FOR UPDATE;
 IF FOUND THEN
  IF v_existing.request_fingerprint<>v_fingerprint THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT'; END IF;
  RETURN QUERY SELECT v_existing.id,v_existing.status,v_existing.expires_at,v_availability.available_seats,v_existing.total_price,v_existing.commission_amount,TRUE; RETURN;
 END IF;
 IF v_availability.available_seats<p_passenger_count THEN RAISE EXCEPTION 'INSUFFICIENT_SEATS'; END IF;
 SELECT commission_rate INTO v_commission_rate FROM public.agencies WHERE id=p_agency_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'AGENCY_NOT_FOUND'; END IF;
 SELECT base_price INTO v_tour_price FROM public.tours WHERE id=v_availability.tour_id;
 IF v_tour_price IS NULL THEN RAISE EXCEPTION 'PRICE_NOT_FOUND'; END IF;
 v_total:=v_tour_price*p_passenger_count; v_commission:=ROUND(v_total*v_commission_rate,2); v_expires_at:=NOW()+make_interval(secs=>p_hold_seconds);
 UPDATE public.availability AS a SET available_seats=a.available_seats-p_passenger_count,updated_at=NOW() WHERE a.id=p_availability_id;
 INSERT INTO public.reservations(availability_id,agency_id,user_id,status,total_price,commission_amount,passenger_count,lead_passenger_name,lead_passenger_document,expires_at,idempotency_key,request_fingerprint) VALUES(p_availability_id,p_agency_id,v_user,'held',v_total,v_commission,p_passenger_count,BTRIM(p_lead_passenger_name),NULLIF(BTRIM(p_lead_passenger_document),''),v_expires_at,BTRIM(p_idempotency_key),v_fingerprint) RETURNING id INTO v_reservation;
 INSERT INTO public.audit_logs(user_id,action,table_name,record_id,new_value) VALUES(v_user,'reservation.held','reservations',v_reservation,jsonb_build_object('availability_id',p_availability_id,'passenger_count',p_passenger_count,'total_price',v_total,'commission_rate',v_commission_rate,'expires_at',v_expires_at,'idempotency_key',BTRIM(p_idempotency_key)));
 RETURN QUERY SELECT v_reservation,'held'::TEXT,v_expires_at,v_availability.available_seats-p_passenger_count,v_total,v_commission,FALSE;
END;
$$;
REVOKE ALL ON FUNCTION public.create_reservation_hold(UUID,UUID,INT,TEXT,TEXT,TEXT,INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_reservation_hold(UUID,UUID,INT,TEXT,TEXT,TEXT,INT) TO authenticated;

CREATE OR REPLACE FUNCTION public.confirm_reservation_hold(p_reservation_id UUID)
RETURNS TABLE(reservation_id UUID,reservation_status TEXT,voucher_token TEXT,total_price NUMERIC,commission_amount NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user UUID:=auth.uid(); v_role TEXT; v_res public.reservations%ROWTYPE; v_availability_id UUID; v_token TEXT;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 SELECT r.availability_id INTO v_availability_id FROM public.reservations AS r WHERE r.id=p_reservation_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'RESERVATION_NOT_FOUND'; END IF;
 PERFORM 1 FROM public.availability AS a WHERE a.id=v_availability_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'AVAILABILITY_NOT_FOUND'; END IF;
 PERFORM public.release_expired_holds(v_availability_id);
 SELECT r.* INTO v_res FROM public.reservations AS r WHERE r.id=p_reservation_id FOR UPDATE;
 SELECT public.current_user_role() INTO v_role;
 IF v_role NOT IN ('admin','agency') THEN RAISE EXCEPTION 'ROLE_NOT_ALLOWED'; END IF;
 IF v_role='agency' AND NOT (v_res.user_id=v_user AND EXISTS(SELECT 1 FROM public.agencies_users au WHERE au.agency_id=v_res.agency_id AND au.user_id=v_user)) THEN RAISE EXCEPTION 'NOT_ALLOWED'; END IF;
 IF v_res.status='confirmed' THEN
  SELECT v.qr_code_token INTO v_token FROM public.vouchers AS v WHERE v.reservation_id=v_res.id LIMIT 1;
  RETURN QUERY SELECT v_res.id,v_res.status,v_token,v_res.total_price,v_res.commission_amount; RETURN;
 END IF;
 IF v_res.status<>'held' THEN RAISE EXCEPTION 'RESERVATION_NOT_CONFIRMABLE'; END IF;
 IF v_res.expires_at IS NULL OR v_res.expires_at<=NOW() THEN PERFORM public.release_expired_holds(v_res.availability_id); RAISE EXCEPTION 'HOLD_EXPIRED'; END IF;
 UPDATE public.reservations AS r SET status='confirmed',expires_at=NULL,updated_at=NOW() WHERE r.id=v_res.id;
 v_token:=encode(extensions.gen_random_bytes(24),'hex');
 INSERT INTO public.vouchers(reservation_id,qr_code_token) VALUES(v_res.id,v_token);
 INSERT INTO public.audit_logs(user_id,action,table_name,record_id,old_value,new_value) VALUES(v_user,'reservation.confirmed','reservations',v_res.id,jsonb_build_object('status','held','expires_at',v_res.expires_at),jsonb_build_object('status','confirmed','voucher_issued',TRUE));
 RETURN QUERY SELECT v_res.id,'confirmed'::TEXT,v_token,v_res.total_price,v_res.commission_amount;
END;
$$;
REVOKE ALL ON FUNCTION public.confirm_reservation_hold(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_reservation_hold(UUID) TO authenticated;
COMMENT ON FUNCTION public.create_reservation_hold(UUID,UUID,INT,TEXT,TEXT,TEXT,INT) IS 'Creates an expiring, idempotent inventory hold. It does not issue a voucher or represent payment.';
COMMENT ON FUNCTION public.confirm_reservation_hold(UUID) IS 'Confirms an unexpired owned hold and issues its voucher atomically.';
