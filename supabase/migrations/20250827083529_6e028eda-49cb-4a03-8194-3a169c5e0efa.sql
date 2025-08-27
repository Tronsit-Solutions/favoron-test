-- Ensure adminAssignedTip is stored inside products_data for single-product packages
-- 1) Create function to sync admin_assigned_tip into products_data
CREATE OR REPLACE FUNCTION public.ensure_admin_tip_in_products()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  arr_length int;
  has_admin_tip boolean;
BEGIN
  -- Only act when there is a meaningful admin tip
  IF NEW.admin_assigned_tip IS NULL OR NEW.admin_assigned_tip <= 0 THEN
    RETURN NEW;
  END IF;

  -- If products_data is missing or empty, create a single-product array from legacy fields
  IF NEW.products_data IS NULL OR jsonb_typeof(NEW.products_data) <> 'array' OR jsonb_array_length(NEW.products_data) = 0 THEN
    NEW.products_data := jsonb_build_array(
      jsonb_build_object(
        'itemDescription', COALESCE(NEW.item_description, ''),
        'estimatedPrice', COALESCE(NEW.estimated_price, 0)::text,
        'itemLink', NEW.item_link,
        'quantity', '1',
        'adminAssignedTip', NEW.admin_assigned_tip
      )
    );
    RETURN NEW;
  END IF;

  -- If it is a single product and missing adminAssignedTip, set it
  arr_length := jsonb_array_length(NEW.products_data);
  IF arr_length = 1 THEN
    has_admin_tip := COALESCE((NEW.products_data->0->>'adminAssignedTip')::numeric, 0) > 0;
    IF NOT has_admin_tip THEN
      NEW.products_data := jsonb_set(
        NEW.products_data,
        '{0,adminAssignedTip}',
        to_jsonb(NEW.admin_assigned_tip)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Create trigger to enforce the rule before insert/update
DROP TRIGGER IF EXISTS trg_ensure_admin_tip_in_products ON public.packages;
CREATE TRIGGER trg_ensure_admin_tip_in_products
BEFORE INSERT OR UPDATE OF admin_assigned_tip, products_data ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.ensure_admin_tip_in_products();

-- 3) Backfill existing rows (single-product cases without adminAssignedTip in products_data)
UPDATE public.packages p
SET products_data = p.products_data -- touch the column so the trigger runs
WHERE p.admin_assigned_tip IS NOT NULL
  AND p.admin_assigned_tip > 0
  AND (
    p.products_data IS NULL
    OR jsonb_typeof(p.products_data) <> 'array'
    OR jsonb_array_length(p.products_data) = 0
    OR (
      jsonb_array_length(p.products_data) = 1
      AND COALESCE((p.products_data->0->>'adminAssignedTip')::numeric, 0) = 0
    )
  );