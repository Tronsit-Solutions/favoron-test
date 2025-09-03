
-- 1) Reemplazar el view con filtros de acceso por usuario y admin
CREATE OR REPLACE VIEW public.trips_with_user
WITH (security_barrier)
AS
SELECT
  t.package_receiving_address,
  t.from_city,
  t.to_city,
  t.from_country,
  t.delivery_date,
  t.last_day_packages,
  t.first_day_packages,
  t.arrival_date,
  t.departure_date,
  t.status,
  t.delivery_method,
  t.user_id,
  CONCAT(p.first_name, ' ', p.last_name) AS user_display_name,
  t.available_space,
  p.phone_number,
  t.created_at,
  t.updated_at,
  t.id,
  t.messenger_pickup_info,
  p.first_name,
  p.last_name,
  p.username,
  p.email
FROM public.trips t
JOIN public.profiles p ON p.id = t.user_id
WHERE
  -- dueños del viaje
  t.user_id = auth.uid()
  -- o admins
  OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::user_role
  );

COMMENT ON VIEW public.trips_with_user IS
  'Vista segura: solo el dueño del viaje o un admin puede ver filas. Incluye datos del perfil (teléfono/email).';

-- 2) Asegurar permisos del view (sin acceso público/anon)
REVOKE ALL ON TABLE public.trips_with_user FROM PUBLIC;
REVOKE ALL ON TABLE public.trips_with_user FROM anon;
REVOKE ALL ON TABLE public.trips_with_user FROM authenticated;

-- 3) Conceder solo SELECT a usuarios autenticados (filtro adicional lo aplica el WHERE del view)
GRANT SELECT ON TABLE public.trips_with_user TO authenticated;
