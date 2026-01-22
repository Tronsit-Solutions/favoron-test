-- Make traveler_dismiss_package purely visual (no notifications)
-- This is just a dashboard cleanup action for the traveler

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
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  SELECT * INTO v_package FROM packages WHERE id = _package_id;
  IF v_package.id IS NULL THEN
    RAISE EXCEPTION 'Paquete no encontrado';
  END IF;
  
  v_trip_id := v_package.matched_trip_id;
  
  IF v_trip_id IS NULL THEN
    RAISE EXCEPTION 'Paquete no asignado a ningún viaje';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM trips WHERE id = v_trip_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para descartar este paquete';
  END IF;
  
  -- Realizar el descarte (solo actualizar campos, SIN notificaciones)
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
  
  -- SIN NOTIFICACIONES - Es puramente visual para el viajero
END;
$$;