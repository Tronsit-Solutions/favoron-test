-- Secure sensitive views and enforce RLS
BEGIN;

-- 1) Enforce RLS even for table owners on sensitive base tables
ALTER TABLE public.packages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.trips FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.package_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;

-- 2) Ensure views execute with invoker privileges and act as security barriers
-- so that underlying table RLS is applied and predicate pushdown cannot leak data
ALTER VIEW public.package_products_view SET (security_invoker = on);
ALTER VIEW public.package_products_view SET (security_barrier = on);

ALTER VIEW public.trips_with_user SET (security_invoker = on);
ALTER VIEW public.trips_with_user SET (security_barrier = on);

-- 3) Lock down view privileges: remove PUBLIC access and grant least privilege
REVOKE ALL ON public.package_products_view FROM PUBLIC;
REVOKE ALL ON public.trips_with_user FROM PUBLIC;

GRANT SELECT ON public.package_products_view TO authenticated;
GRANT SELECT ON public.trips_with_user TO authenticated;

-- Allow backend usage via service key
GRANT SELECT ON public.package_products_view TO service_role;
GRANT SELECT ON public.trips_with_user TO service_role;

COMMIT;