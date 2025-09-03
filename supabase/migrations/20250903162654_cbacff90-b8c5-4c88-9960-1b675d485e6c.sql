
-- Secure trips_with_user view by scoping rows to the current user or admins,
-- and tightening privileges to prevent public/anon access.

-- 1) Recreate the view with a security filter aligned to underlying RLS:
--    - Admins (has_role(..., 'admin')) see all rows
--    - Non-admins see only rows where t.user_id = auth.uid()
CREATE OR REPLACE VIEW public.trips_with_user AS
SELECT
  t.id,
  t.user_id,
  t.from_city,
  t.to_city,
  t.from_country,
  t.departure_date,
  t.arrival_date,
  t.delivery_date,
  t.first_day_packages,
  t.last_day_packages,
  t.available_space,
  t.package_receiving_address,
  t.messenger_pickup_info,
  t.created_at,
  t.updated_at,
  t.status,
  t.delivery_method,
  COALESCE(
    NULLIF(BTRIM(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, ''))), ''),
    p.username,
    p.email
  ) AS user_display_name,
  p.first_name,
  p.last_name,
  p.username,
  p.email,
  p.phone_number
FROM public.trips t
JOIN public.profiles p
  ON p.id = t.user_id
WHERE
  has_role(auth.uid(), 'admin'::user_role)
  OR t.user_id = auth.uid();

-- 2) Add security barrier for extra safety (prevents certain planner pushdowns)
ALTER VIEW public.trips_with_user SET (security_barrier = true);

-- 3) Restrict privileges so the view is not accessible to anon
REVOKE ALL ON public.trips_with_user FROM anon;

-- 4) Allow authenticated clients to select (RLS-equivalent scoping is enforced by the view)
GRANT SELECT ON public.trips_with_user TO authenticated;
