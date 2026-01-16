-- Función RPC para obtener información del viajero de un trip
-- Solo accesible si el usuario tiene un paquete asignado a ese trip
CREATE OR REPLACE FUNCTION public.get_trip_with_traveler_info(trip_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  traveler_name text,
  arrival_date date,
  delivery_date date,
  from_city text,
  to_city text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo permitir si el usuario tiene un paquete asignado a este trip
  IF NOT EXISTS (
    SELECT 1 FROM packages p
    WHERE p.matched_trip_id = get_trip_with_traveler_info.trip_id
    AND p.user_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    t.id,
    t.user_id,
    COALESCE(
      NULLIF(TRIM(CONCAT(pr.first_name, ' ', pr.last_name)), ''),
      pr.username,
      'Desconocido'
    )::text as traveler_name,
    t.arrival_date,
    t.delivery_date,
    t.from_city,
    t.to_city
  FROM trips t
  LEFT JOIN profiles pr ON t.user_id = pr.id
  WHERE t.id = get_trip_with_traveler_info.trip_id;
END;
$$;