
-- Función: sincroniza campos legados desde products_data
CREATE OR REPLACE FUNCTION public.sync_legacy_product_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count int;
  v_total numeric := 0;
  v_first jsonb;
  v_desc text := NULL;
  v_link text := NULL;
BEGIN
  -- Solo actuar si hay arreglo de productos válido
  IF NEW.products_data IS NULL OR jsonb_typeof(NEW.products_data) <> 'array' OR jsonb_array_length(NEW.products_data) = 0 THEN
    RETURN NEW;
  END IF;

  v_count := jsonb_array_length(NEW.products_data);

  -- Total estimado = sum(estimatedPrice * quantity) con defaults seguros
  SELECT COALESCE(SUM(
    COALESCE(NULLIF(p->>'estimatedPrice','')::numeric, 0) *
    COALESCE(NULLIF(p->>'quantity','')::int, 1)
  ), 0)
  INTO v_total
  FROM jsonb_array_elements(NEW.products_data) p;

  -- Primer producto
  SELECT e.elem
  INTO v_first
  FROM jsonb_array_elements(NEW.products_data) WITH ORDINALITY AS e(elem, ord)
  WHERE ord = 1;

  -- Descripción y link
  IF v_count = 1 THEN
    v_desc := COALESCE(v_first->>'itemDescription', '');
    v_link := NULLIF(v_first->>'itemLink','');
  ELSE
    -- concatenar hasta 5 descripciones para no hacer el texto demasiado largo
    SELECT string_agg(trim(COALESCE(t.p->>'itemDescription','')), ', ')
    INTO v_desc
    FROM (
      SELECT p, ord
      FROM jsonb_array_elements(NEW.products_data) WITH ORDINALITY AS t(p, ord)
      ORDER BY ord
      LIMIT 5
    ) AS t;

    v_desc := CONCAT('Pedido de ', v_count, ' productos: ', LEFT(COALESCE(v_desc, ''), 180));
    v_link := NULL;
  END IF;

  -- Escribir en los campos legados
  NEW.estimated_price := COALESCE(v_total, 0);

  IF v_desc IS NOT NULL AND length(v_desc) > 0 THEN
    NEW.item_description := v_desc;
  END IF;

  -- Cuando hay múltiples productos dejamos item_link en NULL
  NEW.item_link := v_link;

  RETURN NEW;
END;
$function$;

-- Trigger: ejecuta la sincronización en cada INSERT/UPDATE de products_data
DROP TRIGGER IF EXISTS trg_sync_legacy_fields_from_products_data ON public.packages;

CREATE TRIGGER trg_sync_legacy_fields_from_products_data
BEFORE INSERT OR UPDATE OF products_data
ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.sync_legacy_product_fields();

-- Backfill: recalcula para registros existentes
UPDATE public.packages
SET products_data = products_data
WHERE products_data IS NOT NULL;
