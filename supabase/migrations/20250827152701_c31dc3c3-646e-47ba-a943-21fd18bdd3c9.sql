
-- 1) Actualizar la función para que también limpie adminAssignedTip dentro de products_data al rechazar
CREATE OR REPLACE FUNCTION public.traveler_reject_assignment(
  _package_id uuid,
  _rejection_reason text DEFAULT NULL,
  _wants_requote boolean DEFAULT false,
  _additional_comments text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  package_traveler_id UUID;
  package_shopper_id UUID;
  package_item_description TEXT;
  admin_user_id UUID;
  cleaned_products jsonb;
BEGIN
  -- Verify that the current user is the assigned traveler
  SELECT t.user_id, p.user_id, p.item_description
  INTO package_traveler_id, package_shopper_id, package_item_description
  FROM public.packages p
  LEFT JOIN public.trips t ON t.id = p.matched_trip_id
  WHERE p.id = _package_id;
  
  IF package_traveler_id IS NULL OR package_traveler_id != auth.uid() THEN
    RAISE EXCEPTION 'No tienes permisos para rechazar este paquete o el paquete no existe';
  END IF;

  -- Construir versión de products_data sin la clave adminAssignedTip (si existe)
  SELECT CASE 
           WHEN p.products_data IS NOT NULL 
                AND jsonb_typeof(p.products_data) = 'array' 
                AND jsonb_array_length(p.products_data) > 0
             THEN (
               SELECT jsonb_agg(elem - 'adminAssignedTip')
               FROM jsonb_array_elements(p.products_data) AS elem
             )
           ELSE p.products_data
         END
  INTO cleaned_products
  FROM public.packages p
  WHERE p.id = _package_id;

  -- Update the package with rejection data, clear trip assignment, admin tip y tips por producto
  UPDATE public.packages
  SET 
    rejection_reason = _rejection_reason,
    wants_requote = _wants_requote,
    additional_notes = _additional_comments,
    quote = NULL,
    matched_trip_id = NULL,
    traveler_address = NULL,
    matched_trip_dates = NULL,
    quote_expires_at = NULL,
    matched_assignment_expires_at = NULL,
    admin_assigned_tip = NULL,
    products_data = cleaned_products,
    status = 'approved', -- volver a aprobado para reasignación
    updated_at = NOW()
  WHERE id = _package_id;

  -- Log admin action
  PERFORM log_admin_action(
    _package_id,
    package_traveler_id,
    'traveler_rejection',
    'Traveler rejected admin-assigned package',
    jsonb_build_object(
      'rejection_reason', _rejection_reason,
      'wants_requote', _wants_requote,
      'additional_comments', _additional_comments
    )
  );

  -- Notify shopper about rejection
  PERFORM public.create_notification(
    package_shopper_id,
    '🔄 Paquete disponible para reasignación',
    CONCAT('El viajero ha rechazado la asignación para "', package_item_description, '". Favorón buscará otro viajero disponible.'),
    'package',
    'normal',
    NULL,
    jsonb_build_object(
      'package_id', _package_id,
      'change_type', 'traveler_rejection'
    )
  );

  -- Notify admins about rejection for reassignment
  FOR admin_user_id IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    PERFORM public.create_notification(
      admin_user_id,
      '🔄 Paquete rechazado - Disponible para reasignación',
      CONCAT('El paquete "', package_item_description, '" fue rechazado por el viajero y está disponible para reasignación.'),
      'package',
      'normal',
      NULL,
      jsonb_build_object(
        'package_id', _package_id,
        'action_needed', 'reassign_package'
      )
    );
  END LOOP;
END;
$function$;

-- 2) Backfill opcional para homogenizar datos existentes SOLO cuando hay 1 producto
-- - Si hay admin_assigned_tip > 0
-- - Y products_data es NULL o es array de 1 elemento sin adminAssignedTip
-- Entonces asignar adminAssignedTip en el único producto
WITH candidates AS (
  SELECT 
    p.id,
    p.admin_assigned_tip,
    p.item_description,
    p.item_link,
    p.estimated_price,
    CASE 
      WHEN p.products_data IS NULL THEN NULL
      WHEN jsonb_typeof(p.products_data) = 'array' AND jsonb_array_length(p.products_data) = 1 THEN p.products_data
      ELSE NULL
    END AS single_product_array
  FROM public.packages p
  WHERE p.admin_assigned_tip IS NOT NULL
    AND p.admin_assigned_tip > 0
)
UPDATE public.packages AS tgt
SET products_data = CASE
  WHEN c.single_product_array IS NULL THEN
    -- No había products_data: creamos un arreglo con el producto legado
    jsonb_build_array(
      jsonb_build_object(
        'itemDescription', COALESCE(tgt.item_description, ''),
        'estimatedPrice', COALESCE(tgt.estimated_price, 0)::text,
        'itemLink', tgt.item_link,
        'quantity', '1',
        'adminAssignedTip', c.admin_assigned_tip
      )
    )
  ELSE
    -- Había un único producto: inyectamos adminAssignedTip si faltaba
    (
      SELECT jsonb_agg(
               CASE 
                 WHEN elem ? 'adminAssignedTip' THEN elem
                 ELSE jsonb_set(elem, '{adminAssignedTip}', to_jsonb(c.admin_assigned_tip))
               END
             )
      FROM jsonb_array_elements(c.single_product_array) AS elem
    )
END
FROM candidates c
WHERE tgt.id = c.id
  AND (
    tgt.products_data IS NULL
    OR (
      jsonb_typeof(tgt.products_data) = 'array' 
      AND jsonb_array_length(tgt.products_data) = 1
      AND NOT (tgt.products_data->0 ? 'adminAssignedTip')
    )
  );
