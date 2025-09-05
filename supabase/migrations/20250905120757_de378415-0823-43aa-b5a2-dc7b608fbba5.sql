-- Tighten access to potentially sensitive views without breaking app functionality
-- 1) Restrict direct access to trips_with_user (contains phone_number)
REVOKE ALL ON TABLE public.trips_with_user FROM anon;
REVOKE ALL ON TABLE public.trips_with_user FROM authenticated;
-- Keep access for service role and postgres implicitly. Admins already use secure RPC get_admin_trips_with_user()

-- Optional hardening: mark as security barrier to avoid leakage via pushdown optimizations
ALTER VIEW public.trips_with_user SET (security_barrier = on);

-- 2) Restrict public_profiles to authenticated users only (no anonymous access)
REVOKE ALL ON TABLE public.public_profiles FROM anon;
GRANT SELECT ON TABLE public.public_profiles TO authenticated;

-- Optional hardening: security barrier on view
ALTER VIEW public.public_profiles SET (security_barrier = on);

-- 3) Document intent so future devs understand rationale
COMMENT ON VIEW public.trips_with_user IS 'Admin-only view. Direct SELECT revoked for anon/authenticated; access via RPC get_admin_trips_with_user() which enforces admin role.';
COMMENT ON VIEW public.public_profiles IS 'Public-safe profile projection. Accessible to authenticated only; contains no emails/phone numbers.';