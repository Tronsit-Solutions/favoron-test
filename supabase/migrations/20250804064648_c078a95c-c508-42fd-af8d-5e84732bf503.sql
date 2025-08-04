-- Test manual: simular asignación de paquete
-- Primero crear un paquete de prueba sin trip asignado
DO $$
DECLARE
  test_package_id UUID;
  test_trip_id UUID;
  test_user_id UUID;
BEGIN
  -- Obtener un usuario y trip existente para la prueba
  SELECT id INTO test_user_id FROM profiles LIMIT 1;
  SELECT id INTO test_trip_id FROM trips WHERE status = 'approved' LIMIT 1;
  
  -- Insertar paquete de prueba
  INSERT INTO packages (user_id, item_description, purchase_origin, package_destination, delivery_deadline, status)
  VALUES (test_user_id, 'Test Package Notification', 'USA', 'Guatemala', NOW() + INTERVAL '30 days', 'approved')
  RETURNING id INTO test_package_id;
  
  RAISE NOTICE 'Paquete de prueba creado: %', test_package_id;
  
  -- Ahora simular la asignación (esto debería activar el trigger)
  UPDATE packages 
  SET matched_trip_id = test_trip_id, status = 'matched'
  WHERE id = test_package_id;
  
  RAISE NOTICE 'Paquete asignado al trip: %', test_trip_id;
  
  -- Limpiar después de la prueba
  DELETE FROM packages WHERE id = test_package_id;
  RAISE NOTICE 'Paquete de prueba eliminado';
END $$;