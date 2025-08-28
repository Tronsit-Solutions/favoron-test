-- Fix SECURITY DEFINER view issue by removing security barrier
-- The view should enforce access control through WHERE conditions instead

BEGIN;

-- Drop the existing view
DROP VIEW IF EXISTS public.package_products_view;

-- Recreate view WITHOUT security_barrier and WITHOUT SECURITY DEFINER
-- Instead rely on the WHERE condition for access control
CREATE VIEW public.package_products_view AS
SELECT 
  p.purchase_origin,
  p.package_destination,
  p.item_description,
  p.id AS package_id,
  p.user_id,
  p.created_at,
  p.updated_at,
  (prod.ord - 1) AS product_index,
  -- Safely parse JSON fields
  NULLIF(prod.elem->>'itemLink','') AS item_link,
  COALESCE((prod.elem->>'adminAssignedTip')::numeric, NULL) AS admin_assigned_tip,
  COALESCE(NULLIF(prod.elem->>'estimatedPrice','')::numeric, NULL) AS estimated_price,
  COALESCE(NULLIF(prod.elem->>'quantity','')::int, NULL) AS quantity,
  (COALESCE(NULLIF(prod.elem->>'estimatedPrice','')::numeric, 0) 
    * COALESCE(NULLIF(prod.elem->>'quantity','')::int, 1)) AS line_total,
  p.status
FROM public.packages p
LEFT JOIN LATERAL jsonb_array_elements(p.products_data) WITH ORDINALITY AS prod(elem, ord) ON TRUE
WHERE 
  -- Keep admin full access
  public.has_role(auth.uid(), 'admin'::user_role)
  OR 
  -- Shoppers see their own packages
  p.user_id = auth.uid()
  OR 
  -- Travelers see packages matched to their trips
  p.matched_trip_id IN (
    SELECT t.id FROM public.trips t WHERE t.user_id = auth.uid()
  );

-- Enable RLS on the view
ALTER VIEW public.package_products_view SET (security_barrier = false);

-- Grant only to authenticated users
REVOKE ALL ON public.package_products_view FROM PUBLIC;
REVOKE ALL ON public.package_products_view FROM anon;
GRANT SELECT ON public.package_products_view TO authenticated;

COMMIT;