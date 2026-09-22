-- Role-aware access control for Galapagos System.
-- Run after the initial schema migration.

INSERT INTO public.roles (name, description)
VALUES
  ('admin', 'Acceso completo al sistema'),
  ('agency', 'Gestión de reservas de una agencia'),
  ('operator', 'Gestión operativa de embarcaciones y salidas')
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_role UUID;
BEGIN
  SELECT id INTO default_role FROM public.roles WHERE name = 'agency' LIMIT 1;

  INSERT INTO public.profiles (id, role_id, first_name, last_name)
  VALUES (
    NEW.id,
    default_role,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.name
  FROM public.profiles p
  JOIN public.roles r ON r.id = p.role_id
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;

-- Replace the initial permissive policies with role-aware policies.
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow read access to public" ON public.roles;
DROP POLICY IF EXISTS "Allow read access to public" ON public.agencies;
DROP POLICY IF EXISTS "Allow read access to public" ON public.vessels;
DROP POLICY IF EXISTS "Allow read access to public" ON public.availability;

CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "profiles_update_own_or_admin"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid() OR public.current_user_role() = 'admin')
WITH CHECK (id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "roles_select_authenticated"
ON public.roles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "agencies_select_authenticated"
ON public.agencies FOR SELECT TO authenticated
USING (
  public.current_user_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM public.agencies_users au
    WHERE au.agency_id = agencies.id AND au.user_id = auth.uid()
  )
);

CREATE POLICY "agencies_admin_write"
ON public.agencies FOR ALL TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "vessels_select_authenticated"
ON public.vessels FOR SELECT TO authenticated
USING (public.current_user_role() IN ('admin', 'agency', 'operator'));

CREATE POLICY "vessels_admin_or_owner_write"
ON public.vessels FOR ALL TO authenticated
USING (public.current_user_role() = 'admin' OR owner_id = auth.uid())
WITH CHECK (public.current_user_role() = 'admin' OR owner_id = auth.uid());

CREATE POLICY "availability_select_authenticated"
ON public.availability FOR SELECT TO authenticated
USING (public.current_user_role() IN ('admin', 'agency', 'operator'));

CREATE POLICY "availability_admin_or_operator_write"
ON public.availability FOR ALL TO authenticated
USING (public.current_user_role() IN ('admin', 'operator'))
WITH CHECK (public.current_user_role() IN ('admin', 'operator'));

-- Reservations are private to the booking agency, operator, or administrator.
CREATE POLICY "reservations_select_role_scoped"
ON public.reservations FOR SELECT TO authenticated
USING (
  public.current_user_role() = 'admin'
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.agencies_users au
    WHERE au.agency_id = reservations.agency_id AND au.user_id = auth.uid()
  )
  OR public.current_user_role() = 'operator'
);

CREATE POLICY "reservations_insert_authenticated"
ON public.reservations FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_role() IN ('admin', 'agency')
  AND user_id = auth.uid()
);

CREATE POLICY "reservations_update_role_scoped"
ON public.reservations FOR UPDATE TO authenticated
USING (
  public.current_user_role() = 'admin'
  OR public.current_user_role() = 'operator'
  OR user_id = auth.uid()
)
WITH CHECK (
  public.current_user_role() = 'admin'
  OR public.current_user_role() = 'operator'
  OR user_id = auth.uid()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_agencies_users_user_id ON public.agencies_users(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_availability_id ON public.reservations(availability_id);
