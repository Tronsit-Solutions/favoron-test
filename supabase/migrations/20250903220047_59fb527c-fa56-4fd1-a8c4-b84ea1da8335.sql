-- Secure views that expose user PII by enforcing invoker privileges and restricting access
-- 1) public.trips_with_user already secured in previous migration; re-assert for idempotency
ALTER VIEW public.trips_with_user SET (security_invoker = true);
ALTER VIEW public.trips_with_user SET (security_barrier = true);

REVOKE ALL ON TABLE public.trips_with_user FROM PUBLIC;
REVOKE ALL ON TABLE public.trips_with_user FROM anon;
REVOKE ALL ON TABLE public.trips_with_user FROM authenticated;
REVOKE ALL ON TABLE public.trips_with_user FROM service_role;

GRANT SELECT ON TABLE public.trips_with_user TO authenticated;
GRANT SELECT ON TABLE public.trips_with_user TO service_role;

COMMENT ON VIEW public.trips_with_user IS
  'Secured view. Evaluates RLS via invoker; restricted to authenticated/service_role. Contains PII (email, phone_number).';

-- 2) Secure public.public_profiles in the same way
ALTER VIEW public.public_profiles SET (security_invoker = true);
ALTER VIEW public.public_profiles SET (security_barrier = true);

REVOKE ALL ON TABLE public.public_profiles FROM PUBLIC;
REVOKE ALL ON TABLE public.public_profiles FROM anon;
REVOKE ALL ON TABLE public.public_profiles FROM authenticated;
REVOKE ALL ON TABLE public.public_profiles FROM service_role;

GRANT SELECT ON TABLE public.public_profiles TO authenticated;
GRANT SELECT ON TABLE public.public_profiles TO service_role;

COMMENT ON VIEW public.public_profiles IS
  'Public profile summary view. Secured: invoker RLS, no public/anon, authenticated/service_role only.';