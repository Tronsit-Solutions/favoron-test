-- Fix linter: make view run with invoker's privileges (not definer)
ALTER VIEW public.trips_with_user SET (security_invoker = true);

-- Re-assert strict privileges
REVOKE ALL ON TABLE public.trips_with_user FROM PUBLIC;
REVOKE ALL ON TABLE public.trips_with_user FROM anon;
REVOKE ALL ON TABLE public.trips_with_user FROM authenticated;
GRANT SELECT ON TABLE public.trips_with_user TO authenticated;