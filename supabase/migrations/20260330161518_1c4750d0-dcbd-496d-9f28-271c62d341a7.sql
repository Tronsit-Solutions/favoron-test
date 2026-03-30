-- Update traveler_dismiss_package to handle multi-assignment dismissals
-- When matched_trip_id is NULL, find assignment via package_assignments table

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
  v_assignment_id UUID;
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
  
  -- Multi-assignment path: matched_trip_id is NULL, find via package_assignments
  IF v_trip_id IS NULL THEN
    SELECT pa.id INTO v_assignment_id
    FROM package_assignments pa
    JOIN trips t ON t.id = pa.trip_id
    WHERE pa.package_id = _package_id
      AND t.user_id = v_user_id
      AND pa.dismissed_by_traveler = false
    ORDER BY pa.created_at DESC
    LIMIT 1;
    
    IF v_assignment_id IS NULL THEN
      RAISE EXCEPTION 'No se encontró asignación activa para este paquete';
    END IF;
    
    UPDATE package_assignments
    SET dismissed_by_traveler = true, updated_at = now()
    WHERE id = v_assignment_id;
    
    RETURN;
  END IF;
  
  -- Legacy path: matched_trip_id is set
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
END;
$$;