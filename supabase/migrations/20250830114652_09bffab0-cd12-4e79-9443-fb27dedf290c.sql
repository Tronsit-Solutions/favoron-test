-- 1) Index to optimize joins/filters by user on trips
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips (user_id);

-- 2) View to expose trips with user info without denormalizing names
CREATE OR REPLACE VIEW public.trips_with_user AS
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

COMMENT ON VIEW public.trips_with_user IS 'Convenience view: trips joined with profiles; user_display_name computed. RLS on base tables still applies.';
