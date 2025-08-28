-- Secure access to package_products_view via security invoker and restricted grants
DO $$ BEGIN
  -- Set view to run with invoker rights (Postgres 15+)
  ALTER VIEW public.package_products_view SET (security_invoker = on);
EXCEPTION WHEN undefined_object THEN
  RAISE NOTICE 'View package_products_view not found, skipping security_invoker setting';
END $$;

-- Revoke broad access from public/anon/authenticated and grant minimal
REVOKE ALL ON public.package_products_view FROM PUBLIC;
REVOKE ALL ON public.package_products_view FROM anon;
REVOKE ALL ON public.package_products_view FROM authenticated;

-- Optionally grant to authenticated only if needed by RPC owner (we'll use a function instead)
-- No direct SELECT grants to avoid bypassing filters

-- Create a secure RPC that enforces per-user access consistent with packages RLS
CREATE OR REPLACE FUNCTION public.get_package_products()
RETURNS SETOF public.package_products_view
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT pv.*
  FROM public.package_products_view pv
  JOIN public.packages p ON p.id = pv.package_id
  WHERE
    (
      p.user_id = auth.uid()
      OR p.matched_trip_id IN (
        SELECT t.id FROM public.trips t WHERE t.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
      )
    );
$$;

-- Allow only authenticated users to execute the RPC
REVOKE ALL ON FUNCTION public.get_package_products() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_package_products() TO authenticated;
