-- 1) Ensure products_data is a JSON array (constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_data_is_array'
  ) THEN
    ALTER TABLE public.packages 
    ADD CONSTRAINT products_data_is_array 
    CHECK (products_data IS NULL OR jsonb_typeof(products_data) = 'array');
  END IF;
END $$;

-- 2) Create or replace view to unnest products_data preserving order
CREATE OR REPLACE VIEW public.package_products_view AS
SELECT 
  p.id AS package_id,
  p.user_id,
  p.status,
  p.purchase_origin,
  p.package_destination,
  p.created_at,
  p.updated_at,
  e.ord::int AS product_index,
  NULLIF(e.elem->>'itemDescription','') AS item_description,
  NULLIF(e.elem->>'itemLink','') AS item_link,
  COALESCE(NULLIF(e.elem->>'estimatedPrice','')::numeric, 0)::numeric AS estimated_price,
  COALESCE(NULLIF(e.elem->>'quantity','')::int, 1)::int AS quantity,
  (COALESCE(NULLIF(e.elem->>'estimatedPrice','')::numeric, 0) * COALESCE(NULLIF(e.elem->>'quantity','')::int, 1))::numeric AS line_total,
  COALESCE(NULLIF(e.elem->>'adminAssignedTip','')::numeric, 0)::numeric AS admin_assigned_tip
FROM public.packages p
CROSS JOIN LATERAL jsonb_array_elements(p.products_data) WITH ORDINALITY AS e(elem, ord)
WHERE p.products_data IS NOT NULL AND jsonb_typeof(p.products_data) = 'array';

COMMENT ON VIEW public.package_products_view IS 'Flattened per-product view from packages.products_data preserving order (product_index starts at 1)';

-- 3) Trigger to sync legacy summary fields from products_data (function already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_sync_legacy_product_fields'
  ) THEN
    CREATE TRIGGER trg_sync_legacy_product_fields
    BEFORE INSERT OR UPDATE OF products_data ON public.packages
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_legacy_product_fields();
  END IF;
END $$;

-- 4) Backfill legacy fields for existing rows with products_data
UPDATE public.packages
SET products_data = products_data
WHERE products_data IS NOT NULL;