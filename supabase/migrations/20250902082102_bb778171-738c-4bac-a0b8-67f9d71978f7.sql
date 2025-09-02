
-- Recrear la vista trips_with_user incluyendo el phone_number del dueño del viaje
DROP VIEW IF EXISTS public.trips_with_user;

CREATE VIEW public.trips_with_user
WITH (security_invoker = on) AS
SELECT
  t.id,
  t.user_id,
  t.from_city,
  t.to_city,
  t.from_country,
  t.departure_date,
  t.arrival_date,
  t.first_day_packages,
  t.last_day_packages,
  t.delivery_date,
  t.status,
  t.delivery_method,
  t.package_receiving_address,
  t.messenger_pickup_info,
  t.available_space,
  t.created_at,
  t.updated_at,
  -- Campos del perfil del viajero
  p.first_name,
  p.last_name,
  p.username,
  p.email,
  p.phone_number, -- NUEVO: teléfono del dueño del viaje
  -- Nombre para mostrar con fallback seguro
  COALESCE(
    NULLIF(trim(concat_ws(' ', p.first_name, p.last_name)), ''),
    NULLIF(p.username, ''),
    p.email
  ) AS user_display_name
FROM public.trips t
LEFT JOIN public.profiles p ON p.id = t.user_id;

COMMENT ON VIEW public.trips_with_user IS
'Convenience view: trips joined with profiles; includes user_display_name and phone_number. Uses SECURITY INVOKER so RLS from base tables applies.';
