-- Secure package_products_view with security barrier and row-level filters aligned with existing RLS
-- Recreate the view to enforce per-user visibility while preserving existing columns

-- 1) Drop and recreate the view atomically
BEGIN;

-- Ensure the view exists before dropping (ignore if not)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_views 
    WHERE schemaname = 'public' AND viewname = 'package_products_view'
  ) THEN
    EXECUTE 'DROP VIEW public.package_products_view';
  END IF;
END$$;

-- 2) Recreate view with security_barrier, projecting the same columns listed in the app/types
CREATE VIEW public.package_products_view
WITH (security_barrier = on)
AS
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

-- 3) Lock down privileges: authenticated users only (no anon)
REVOKE ALL ON public.package_products_view FROM PUBLIC;
REVOKE ALL ON public.package_products_view FROM anon;
GRANT SELECT ON public.package_products_view TO authenticated;
-- Service role and postgres already have sufficient privileges

COMMIT;
