-- Security hardening for reservation and verification data.

REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

DROP POLICY IF EXISTS "reservations_insert_authenticated" ON public.reservations;
CREATE POLICY "reservations_insert_authenticated"
ON public.reservations FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_role() IN ('admin', 'agency')
  AND user_id = auth.uid()
  AND (
    public.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.agencies_users au
      WHERE au.agency_id = reservations.agency_id
        AND au.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "reservations_update_role_scoped" ON public.reservations;
CREATE POLICY "reservations_update_role_scoped"
ON public.reservations FOR UPDATE TO authenticated
USING (
  public.current_user_role() IN ('admin', 'operator')
  OR (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.agencies_users au
      WHERE au.agency_id = reservations.agency_id
        AND au.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  public.current_user_role() IN ('admin', 'operator')
  OR (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.agencies_users au
      WHERE au.agency_id = reservations.agency_id
        AND au.user_id = auth.uid()
    )
  )
);

-- Vouchers are visible to authenticated operational users and to the agency/user
-- attached to the reservation. Public verification should use a narrowly scoped
-- server endpoint instead of exposing the table directly.
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vouchers_select_role_scoped"
ON public.vouchers FOR SELECT TO authenticated
USING (
  public.current_user_role() IN ('admin', 'operator')
  OR EXISTS (
    SELECT 1
    FROM public.reservations r
    WHERE r.id = vouchers.reservation_id
      AND (
        r.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.agencies_users au
          WHERE au.agency_id = r.agency_id AND au.user_id = auth.uid()
        )
      )
  )
);

CREATE POLICY "vouchers_admin_write"
ON public.vouchers FOR ALL TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_admin_select"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.current_user_role() = 'admin');

CREATE POLICY "audit_logs_insert_authenticated"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.current_user_role() = 'admin');
