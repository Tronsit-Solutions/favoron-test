-- Add traveler_dismissal column for tracking (if not exists)
ALTER TABLE packages 
ADD COLUMN IF NOT EXISTS traveler_dismissal JSONB DEFAULT NULL;

-- Drop and recreate the function with the fix
DROP FUNCTION IF EXISTS public.traveler_dismiss_package(uuid);

CREATE OR REPLACE FUNCTION public.traveler_dismiss_package(_package_id UUID)
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
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Get package info
  SELECT * INTO v_package FROM packages WHERE id = _package_id;
  IF v_package.id IS NULL THEN
    RAISE EXCEPTION 'Paquete no encontrado';
  END IF;
  
  v_trip_id := v_package.matched_trip_id;
  package_shopper_id := v_package.user_id;
  package_item_description := v_package.item_description;
  
  IF v_trip_id IS NULL THEN
    RAISE EXCEPTION 'Paquete no asignado a ningún viaje';
  END IF;
  
  -- Verify the current user owns the trip
  IF NOT EXISTS (
    SELECT 1 FROM trips WHERE id = v_trip_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para descartar este paquete';
  END IF;
  
  -- Perform the dismissal update (same pattern as traveler_reject_assignment)
  UPDATE public.packages
  SET 
    traveler_dismissal = jsonb_build_object(
      'dismissed_at', now(),
      'dismissed_by', v_user_id,
      'reason', 'quote_expired',
      'previous_trip_id', v_trip_id
    ),
    traveler_dismissed_at = now(),
    quote = NULL,
    matched_trip_id = NULL,
    traveler_address = NULL,
    matched_trip_dates = NULL,
    quote_expires_at = NULL,
    matched_assignment_expires_at = NULL,
    admin_assigned_tip = NULL,
    status = 'approved',
    updated_at = now()
  WHERE id = _package_id;
  
  -- Notify shopper that their package is available for reassignment
  PERFORM public.create_notification(
    package_shopper_id,
    '🔄 Paquete disponible para reasignación',
    CONCAT('El viajero ha descartado el paquete "', package_item_description, '" porque la cotización expiró.'),
    'package',
    'normal',
    NULL,
    jsonb_build_object('package_id', _package_id, 'change_type', 'traveler_dismissal')
  );
  
  -- Notify admins
  FOR admin_user_id IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    PERFORM public.create_notification(
      admin_user_id,
      '🔄 Paquete descartado - Disponible para reasignación',
      CONCAT('El paquete "', package_item_description, '" fue descartado por el viajero (cotización expirada).'),
      'package',
      'normal',
      NULL,
      jsonb_build_object('package_id', _package_id, 'action_needed', 'reassign_package')
    );
  END LOOP;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.traveler_dismiss_package(UUID) TO authenticated;