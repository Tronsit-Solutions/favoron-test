-- Restore read access to the view for authenticated users to avoid breaking existing queries
GRANT SELECT ON public.package_products_view TO authenticated;

-- Recreate secure RPC to fetch package products with proper filtering
DROP FUNCTION IF EXISTS public.get_package_products();
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
    -- Package owners can see their own
    ppv.user_id = auth.uid()
    -- Travelers assigned to the package can see it
    OR ppv.package_id IN (
      SELECT p.id 
      FROM public.packages p 
      JOIN public.trips t ON t.id = p.matched_trip_id 
      WHERE t.user_id = auth.uid()
    )
    -- Admins can see all
    OR public.has_role(auth.uid(), 'admin');
$$;

-- Ensure only authenticated users can execute the function
GRANT EXECUTE ON FUNCTION public.get_package_products() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_package_products() FROM anon;