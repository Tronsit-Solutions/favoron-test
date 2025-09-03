
-- 1) Ensure the view evaluates RLS using the querying user (not the definer)
ALTER VIEW public.trips_with_user SET (security_invoker = true);

-- 2) Add a security barrier for safer predicate handling (defense-in-depth)
ALTER VIEW public.trips_with_user SET (security_barrier = true);

-- 3) Lock down privileges: no public or anon access; only authenticated + service_role
REVOKE ALL ON TABLE public.trips_with_user FROM PUBLIC;
REVOKE ALL ON TABLE public.trips_with_user FROM anon;
REVOKE ALL ON TABLE public.trips_with_user FROM authenticated;
REVOKE ALL ON TABLE public.trips_with_user FROM service_role;

GRANT SELECT ON TABLE public.trips_with_user TO authenticated;
GRANT SELECT ON TABLE public.trips_with_user TO service_role;

-- Optional: clarify intent
COMMENT ON VIEW public.trips_with_user IS
  'Secured view. Evaluates RLS via invoker; restricted to authenticated/service_role. Contains PII (email, phone_number).';
