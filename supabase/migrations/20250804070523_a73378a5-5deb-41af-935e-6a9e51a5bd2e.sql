-- Test directo: hacer un match manual para verificar si el trigger funciona
-- Primero obtener un paquete sin asignar y un viaje activo
DO $$
DECLARE
  test_package_id UUID;
  test_trip_id UUID;
  traveler_user_id UUID;
BEGIN
  -- Obtener un paquete sin asignar
  SELECT id INTO test_package_id 
  FROM packages 
  WHERE matched_trip_id IS NULL 
  AND status = 'approved'
  LIMIT 1;
  
  -- Obtener un viaje activo
  SELECT id, user_id INTO test_trip_id, traveler_user_id
  FROM trips 
  WHERE status = 'approved'
  LIMIT 1;
  
  RAISE NOTICE 'Test Package ID: %, Test Trip ID: %, Traveler ID: %', test_package_id, test_trip_id, traveler_user_id;
  
  -- Solo hacer el test si tenemos los datos necesarios
  IF test_package_id IS NOT NULL AND test_trip_id IS NOT NULL THEN
    -- Simular el match (esto debería activar el trigger)
    UPDATE packages 
    SET matched_trip_id = test_trip_id, status = 'matched'
    WHERE id = test_package_id;
    
    RAISE NOTICE 'Match simulado completado - Package: % matched to Trip: %', test_package_id, test_trip_id;
    
    -- Revertir el cambio para no afectar datos reales
    UPDATE packages 
    SET matched_trip_id = NULL, status = 'approved'
    WHERE id = test_package_id;
    
    RAISE NOTICE 'Cambios revertidos';
  ELSE
    RAISE NOTICE 'No hay datos suficientes para el test';
  END IF;
END $$;