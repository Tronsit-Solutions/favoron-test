-- Revoke direct access to package_products_view from default roles
REVOKE ALL ON public.package_products_view FROM anon, authenticated;

-- Create secure RPC function to access package products data
CREATE OR REPLACE FUNCTION public.get_package_products()
RETURNS TABLE (
  package_id uuid,
  user_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  product_index bigint,
  admin_assigned_tip numeric,
  estimated_price numeric,
  status text,
  item_description text,
  package_destination text,
  quantity integer,
  item_link text,
  purchase_origin text,
  line_total numeric
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    ppv.package_id,
    ppv.user_id,
    ppv.created_at,
    ppv.updated_at,
    ppv.product_index,
    ppv.admin_assigned_tip,
    ppv.estimated_price,
    ppv.status,
    ppv.item_description,
    ppv.package_destination,
    ppv.quantity,
    ppv.item_link,
    ppv.purchase_origin,
    ppv.line_total
  FROM public.package_products_view ppv
  WHERE 
    -- Allow access to package owners
    ppv.user_id = auth.uid()
    -- Allow access to travelers assigned to the package
    OR ppv.package_id IN (
      SELECT p.id 
      FROM public.packages p 
      JOIN public.trips t ON t.id = p.matched_trip_id 
      WHERE t.user_id = auth.uid()
    )
    -- Allow access to admins
    OR public.has_role(auth.uid(), 'admin');
$$;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_package_products() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_package_products() FROM anon;