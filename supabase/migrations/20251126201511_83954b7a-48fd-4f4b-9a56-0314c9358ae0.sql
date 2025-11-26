-- Prevenir pérdida de itemLink en products_data cuando se actualiza packages
-- Este trigger se ejecuta ANTES de INSERT o UPDATE
CREATE OR REPLACE FUNCTION public.preserve_product_item_links()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Solo actuar si products_data existe y es un array
  IF NEW.products_data IS NOT NULL 
     AND jsonb_typeof(NEW.products_data) = 'array' 
     AND jsonb_array_length(NEW.products_data) > 0 THEN
    
    -- Para cada producto en el array, asegurar que itemLink esté presente
    NEW.products_data := (
      SELECT jsonb_agg(
        CASE 
          -- Si el producto ya tiene itemLink, mantenerlo
          WHEN elem->>'itemLink' IS NOT NULL AND elem->>'itemLink' != '' THEN 
            elem
          -- Si falta itemLink pero item_link existe a nivel de package, usarlo
          WHEN NEW.item_link IS NOT NULL AND NEW.item_link != '' THEN
            jsonb_set(elem, '{itemLink}', to_jsonb(NEW.item_link))
          -- Si hay un producto anterior en OLD con itemLink, preservarlo
          WHEN TG_OP = 'UPDATE' AND OLD.products_data IS NOT NULL THEN
            CASE
              WHEN (SELECT (old_elem->>'itemLink') 
                    FROM jsonb_array_elements(OLD.products_data) WITH ORDINALITY AS t(old_elem, idx) 
                    WHERE idx = elem_idx) IS NOT NULL
              THEN jsonb_set(elem, '{itemLink}', 
                   to_jsonb((SELECT (old_elem->>'itemLink') 
                             FROM jsonb_array_elements(OLD.products_data) WITH ORDINALITY AS t(old_elem, idx) 
                             WHERE idx = elem_idx)))
              ELSE elem
            END
          ELSE elem
        END
      )
      FROM jsonb_array_elements(NEW.products_data) WITH ORDINALITY AS t(elem, elem_idx)
    );
    
    RAISE NOTICE '🔗 preserve_product_item_links: Preserved itemLink for package %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear el trigger ANTES de los otros triggers para que actúe primero
DROP TRIGGER IF EXISTS preserve_product_links_trigger ON public.packages;
CREATE TRIGGER preserve_product_links_trigger
  BEFORE INSERT OR UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.preserve_product_item_links();

COMMENT ON FUNCTION public.preserve_product_item_links() IS 
  'Previene la pérdida de itemLink en products_data preservando links existentes del package o de versiones anteriores';
COMMENT ON TRIGGER preserve_product_links_trigger ON public.packages IS
  'Se ejecuta ANTES de insertar/actualizar para preservar itemLink en products_data';