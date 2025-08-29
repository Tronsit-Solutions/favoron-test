-- 1) Ensure the view uses SECURITY INVOKER so base-table RLS applies under caller
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_views 
    WHERE schemaname = 'public' AND viewname = 'package_products_view'
  ) THEN
    EXECUTE 'ALTER VIEW public.package_products_view SET (security_invoker = true)';
  ELSE
    RAISE NOTICE 'View public.package_products_view does not exist, skipping security_invoker setting';
  END IF;
END $$;

-- 2) Tighten grants on the view: remove PUBLIC/anon; allow only authenticated & service_role to SELECT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_views 
    WHERE schemaname = 'public' AND viewname = 'package_products_view'
  ) THEN
    -- Revoke from broad roles first
    EXECUTE 'REVOKE ALL ON TABLE public.package_products_view FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE public.package_products_view FROM anon';
    -- Reset and set minimal permissions
    EXECUTE 'REVOKE ALL ON TABLE public.package_products_view FROM authenticated';
    EXECUTE 'GRANT SELECT ON TABLE public.package_products_view TO authenticated';
    EXECUTE 'GRANT SELECT ON TABLE public.package_products_view TO service_role';
    COMMENT ON VIEW public.package_products_view IS 'Restricted view: only authenticated/service_role can read; base-table RLS applies. Prefer RPC public.get_package_products() for explicit filtering.';
  ELSE
    RAISE NOTICE 'View public.package_products_view does not exist, skipping grants';
  END IF;
END $$;

-- 3) Create an explicit, filtered RPC for querying package products with owner/traveler/admin logic
CREATE OR REPLACE FUNCTION public.get_package_products()
RETURNS SETOF public.package_products_view
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  SELECT ppv.*
  FROM public.package_products_view ppv
  WHERE 
    -- Owners (shoppers) can see their own packages' products
    ppv.user_id = auth.uid()
    OR
    -- Travelers assigned to a matched trip can see the package products
    ppv.package_id IN (
      SELECT p.id
      FROM public.packages p
      JOIN public.trips t ON t.id = p.matched_trip_id
      WHERE t.user_id = auth.uid()
    )
    OR
    -- Admins can see everything
    public.has_role(auth.uid(), 'admin'::user_role);
$$;

COMMENT ON FUNCTION public.get_package_products IS 'Secure RPC that returns products visible to the caller: package owner, matched traveler, or admin.';

-- 4) Restrict execution of the RPC
REVOKE ALL ON FUNCTION public.get_package_products() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_package_products() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_package_products() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_package_products() TO service_role;