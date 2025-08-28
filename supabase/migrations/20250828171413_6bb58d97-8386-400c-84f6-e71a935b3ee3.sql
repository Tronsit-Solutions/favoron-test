-- Secure access to package_products_view
-- 1) Revoke any public/anon access (defense-in-depth)
DO $$
BEGIN
  -- Revoke from PUBLIC (includes anon/authenticated)
  EXECUTE 'REVOKE ALL ON TABLE public.package_products_view FROM PUBLIC';
  -- Revoke explicit roles to reset
  EXECUTE 'REVOKE ALL ON TABLE public.package_products_view FROM anon';
  EXECUTE 'REVOKE ALL ON TABLE public.package_products_view FROM authenticated';
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'View public.package_products_view does not exist, skipping grants revocation';
END $$;

-- 2) Grant only what is needed
DO $$
BEGIN
  EXECUTE 'GRANT SELECT ON TABLE public.package_products_view TO authenticated';
  EXECUTE 'GRANT SELECT ON TABLE public.package_products_view TO service_role';
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'View public.package_products_view does not exist, skipping grants';
END $$;

-- Optional: document security intent
COMMENT ON VIEW public.package_products_view IS 'Restricted view: only authenticated and service_role can read; base table RLS still applies to limit rows per user.';