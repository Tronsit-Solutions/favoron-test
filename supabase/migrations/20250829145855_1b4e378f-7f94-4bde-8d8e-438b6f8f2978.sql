
-- Secure access to the view without impacting existing functions

-- 1) Prevent any public/anon access to the view
REVOKE ALL ON VIEW public.package_products_view FROM PUBLIC;
REVOKE ALL ON VIEW public.package_products_view FROM anon;

-- 2) Allow only authenticated users and service_role to read it
GRANT SELECT ON VIEW public.package_products_view TO authenticated;
GRANT SELECT ON VIEW public.package_products_view TO service_role;

-- 3) Add a security barrier to reduce risk of information leakage via planner rewrites
ALTER VIEW public.package_products_view SET (security_barrier = true);

-- 4) (Idempotent) Ensure roles can use the schema (usually already set by Supabase)
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
