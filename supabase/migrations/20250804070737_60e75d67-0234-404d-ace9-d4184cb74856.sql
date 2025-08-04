-- Test real con datos existentes
DO $$
DECLARE
  test_package_id UUID;
  test_trip_id UUID;
  traveler_user_id UUID;
BEGIN
  -- Obtener un paquete completado que ya tenga un trip asignado para revertir y probar
  SELECT id, matched_trip_id INTO test_package_id, test_trip_id
  FROM packages 
  WHERE matched_trip_id IS NOT NULL 
  AND status = 'completed'
  LIMIT 1;
  
  -- Obtener el traveler del trip
  SELECT user_id INTO traveler_user_id
  FROM trips 
  WHERE id = test_trip_id;
  
  RAISE NOTICE 'Usando Package ID: %, Trip ID: %, Traveler ID: %', test_package_id, test_trip_id, traveler_user_id;
  
  IF test_package_id IS NOT NULL THEN
    -- Primero quitar el match
    UPDATE packages 
    SET matched_trip_id = NULL, status = 'approved'
    WHERE id = test_package_id;
    
    RAISE NOTICE 'Match removido temporalmente';
    
    -- Esperar un momento y luego asignar de nuevo (esto debería activar el trigger)
    UPDATE packages 
    SET matched_trip_id = test_trip_id, status = 'matched'
    WHERE id = test_package_id;
    
    RAISE NOTICE 'Match reasignado - debería activar trigger';
    
    -- Revertir al estado original
    UPDATE packages 
    SET status = 'completed'
    WHERE id = test_package_id;
    
    RAISE NOTICE 'Estado revertido a completed';
  ELSE
    RAISE NOTICE 'No se encontraron paquetes para probar';
  END IF;
END $$;