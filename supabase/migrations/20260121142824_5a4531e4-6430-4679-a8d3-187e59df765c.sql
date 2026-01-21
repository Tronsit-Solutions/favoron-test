-- Drop both existing overloaded functions to remove ambiguity
DROP FUNCTION IF EXISTS public.traveler_reject_assignment(uuid, text, boolean, text);
DROP FUNCTION IF EXISTS public.traveler_reject_assignment(uuid, text, text, boolean);

-- Recreate with a single, clean signature with defaults
CREATE OR REPLACE FUNCTION public.traveler_reject_assignment(
  _package_id UUID,
  _rejection_reason TEXT DEFAULT NULL,
  _additional_comments TEXT DEFAULT NULL,
  _wants_requote BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_package packages;
  v_trip_id UUID;
  package_shopper_id UUID;
  package_item_description TEXT;
  admin_user_id UUID;
  cleaned_products jsonb;
BEGIN
  v_user_id := auth.uid();
  
  -- Get package info
  SELECT * INTO v_package FROM packages WHERE id = _package_id;
  IF v_package.id IS NULL THEN
    RAISE EXCEPTION 'Paquete no encontrado';
  END IF;
  
  v_trip_id := v_package.matched_trip_id;
  package_shopper_id := v_package.user_id;
  package_item_description := v_package.item_description;
  
  -- Verify user is the traveler for this trip
  IF NOT EXISTS (
    SELECT 1 FROM trips WHERE id = v_trip_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para rechazar este paquete';
  END IF;
  
  -- Build cleaned products (remove adminAssignedTip)
  SELECT CASE 
    WHEN v_package.products_data IS NOT NULL 
         AND jsonb_typeof(v_package.products_data::jsonb) = 'array' 
         AND jsonb_array_length(v_package.products_data::jsonb) > 0
    THEN (
      SELECT jsonb_agg(elem - 'adminAssignedTip' - 'tipNotes')
      FROM jsonb_array_elements(v_package.products_data::jsonb) AS elem
    )
    ELSE v_package.products_data::jsonb
  END INTO cleaned_products;
  
  -- Update the package
  UPDATE public.packages
  SET 
    traveler_rejection = jsonb_build_object(
      'rejected_at', now(),
      'rejected_by', v_user_id,
      'rejection_reason', _rejection_reason,
      'additional_comments', _additional_comments,
      'previous_trip_id', v_trip_id
    ),
    rejection_reason = _rejection_reason,
    wants_requote = _wants_requote,
    internal_notes = _additional_comments,
    quote = NULL,
    matched_trip_id = NULL,
    traveler_address = NULL,
    matched_trip_dates = NULL,
    quote_expires_at = NULL,
    matched_assignment_expires_at = NULL,
    admin_assigned_tip = NULL,
    products_data = cleaned_products,
    status = 'approved',
    updated_at = NOW()
  WHERE id = _package_id;
  
  -- Notify shopper
  PERFORM public.create_notification(
    package_shopper_id,
    '🔄 Paquete disponible para reasignación',
    CONCAT('El viajero ha rechazado la asignación para "', package_item_description, '".'),
    'package',
    'normal',
    NULL,
    jsonb_build_object('package_id', _package_id, 'change_type', 'traveler_rejection')
  );
  
  -- Notify admins
  FOR admin_user_id IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    PERFORM public.create_notification(
      admin_user_id,
      '🔄 Paquete rechazado - Disponible para reasignación',
      CONCAT('El paquete "', package_item_description, '" fue rechazado por el viajero.'),
      'package',
      'normal',
      NULL,
      jsonb_build_object('package_id', _package_id, 'action_needed', 'reassign_package')
    );
  END LOOP;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.traveler_reject_assignment(uuid, text, text, boolean) TO authenticated;