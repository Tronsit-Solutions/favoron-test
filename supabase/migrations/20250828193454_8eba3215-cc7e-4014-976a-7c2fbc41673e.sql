
BEGIN;

-- 1) Agregar 'additionalNotes' por producto cuando falte, en paquetes que ya tienen products_data (array)
UPDATE public.packages p
SET products_data = (
  SELECT jsonb_agg(
    CASE
      WHEN (elem ? 'additionalNotes') AND (elem->>'additionalNotes') IS NOT NULL
        THEN elem
      ELSE elem || jsonb_build_object('additionalNotes', p.additional_notes)
    END
  )
  FROM jsonb_array_elements(p.products_data) AS e(elem)
)
WHERE p.products_data IS NOT NULL
  AND jsonb_typeof(p.products_data) = 'array'
  AND jsonb_array_length(p.products_data) > 0
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p.products_data) AS e(elem)
    WHERE NOT (elem ? 'additionalNotes') OR (elem->>'additionalNotes') IS NULL
  );

-- 2) Construir products_data para paquetes que no lo tienen (null, no array, o array vacío)
UPDATE public.packages p
SET products_data = jsonb_build_array(jsonb_build_object(
  'itemDescription', COALESCE(p.item_description, ''),
  'estimatedPrice', COALESCE(p.estimated_price, 0)::text,
  'itemLink', p.item_link,
  'quantity', '1',
  'adminAssignedTip', p.admin_assigned_tip,
  'additionalNotes', p.additional_notes
))
WHERE (p.products_data IS NULL OR jsonb_typeof(p.products_data) <> 'array' OR jsonb_array_length(p.products_data) = 0);

COMMIT;
