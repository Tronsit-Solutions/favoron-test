-- Secure the package_products_view without breaking existing functionality
-- 1) Ensure the view executes with invoker’s privileges so base-table RLS is always enforced
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'package_products_view'
  ) THEN
    EXECUTE 'ALTER VIEW public.package_products_view SET (security_invoker = true)';
  END IF;
END $$;

-- 2) Tighten privileges: no public/anon access, allow only authenticated role to SELECT
--    (service_role has elevated privileges already and does not need explicit GRANT)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'package_products_view'
  ) THEN
    -- Revoke broad/default grants
    REVOKE ALL ON public.package_products_view FROM PUBLIC;
    REVOKE ALL ON public.package_products_view FROM anon;
    REVOKE ALL ON public.package_products_view FROM authenticated;

    -- Grant explicit read access only to authenticated users; RLS on base tables still applies
    GRANT SELECT ON public.package_products_view TO authenticated;

    -- Optional: document intent
    COMMENT ON VIEW public.package_products_view IS 'Security: security_invoker=true. Access restricted to authenticated. Base table RLS (packages, etc.) governs row visibility.';
  END IF;
END $$;