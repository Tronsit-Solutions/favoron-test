-- Drop and recreate the view with SECURITY INVOKER to respect user permissions
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
  t.delivery_method,
  t.available_space,
  t.package_receiving_address,
  t.messenger_pickup_info,
  t.status,
  t.created_at,
  t.updated_at,
  -- user fields from profiles (subject to RLS on profiles)
  p.first_name,
  p.last_name,
  p.username,
  p.email,
  -- computed display name with safe fallbacks
  COALESCE(
    NULLIF(trim(concat_ws(' ', p.first_name, p.last_name)), ''),
    NULLIF(p.username, ''),
    p.email
  ) AS user_display_name
FROM public.trips t
LEFT JOIN public.profiles p ON p.id = t.user_id;

COMMENT ON VIEW public.trips_with_user IS 'Convenience view: trips joined with profiles; user_display_name computed. Uses SECURITY INVOKER so RLS from base tables applies.';