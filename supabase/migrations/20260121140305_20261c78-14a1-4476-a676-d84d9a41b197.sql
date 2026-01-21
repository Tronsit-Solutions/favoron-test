-- Create SECURITY DEFINER function for travelers to dismiss expired packages
-- This bypasses RLS safely by performing internal validation

CREATE OR REPLACE FUNCTION public.traveler_dismiss_package(_package_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_trip_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Get the package's matched trip
  SELECT matched_trip_id INTO v_trip_id
  FROM packages
  WHERE id = _package_id;
  
  IF v_trip_id IS NULL THEN
    RAISE EXCEPTION 'Paquete no encontrado o no asignado a ningún viaje';
  END IF;
  
  -- Verify the current user owns the trip
  IF NOT EXISTS (
    SELECT 1 FROM trips WHERE id = v_trip_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para descartar este paquete';
  END IF;
  
  -- Perform the dismissal update
  UPDATE public.packages
  SET 
    traveler_dismissed_at = now(),
    matched_trip_id = NULL,
    traveler_address = NULL,
    matched_trip_dates = NULL,
    updated_at = now()
  WHERE id = _package_id;
  
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.traveler_dismiss_package(UUID) TO authenticated;