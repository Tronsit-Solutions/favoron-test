-- Drop and recreate trips_with_user view with proper security
DROP VIEW IF EXISTS public.trips_with_user;

CREATE VIEW public.trips_with_user
WITH (security_barrier)
AS
SELECT
  t.id,
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
  t.messenger_pickup_info,
  p.first_name,
  p.last_name,
  p.username,
  p.email,
  t.package_receiving_address
FROM public.trips t
JOIN public.profiles p ON p.id = t.user_id
WHERE
  -- owner of the trip
  t.user_id = auth.uid()
  -- or admins using the secure function
  OR public.has_role(auth.uid(), 'admin'::user_role);

COMMENT ON VIEW public.trips_with_user IS
  'Secure view: owner or admin can see rows. Includes profile data (phone/email). Protected by security_barrier and has_role() function.';

-- Secure permissions: no public/anon access, only authenticated users
REVOKE ALL ON TABLE public.trips_with_user FROM PUBLIC;
REVOKE ALL ON TABLE public.trips_with_user FROM anon;
GRANT SELECT ON TABLE public.trips_with_user TO authenticated;