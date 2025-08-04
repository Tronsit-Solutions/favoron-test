-- Verificar y mejorar el trigger de notificaciones para shoppers
-- Especialmente para cuando reciben cotizaciones

-- Primero vamos a hacer un test de cotización
DO $$
DECLARE
  test_package_id UUID;
  shopper_id UUID;
  test_quote JSONB;
BEGIN
  -- Buscar un paquete en estado 'matched' para hacer test
  SELECT id, user_id INTO test_package_id, shopper_id
  FROM packages 
  WHERE status = 'matched' 
  AND matched_trip_id IS NOT NULL
  LIMIT 1;
  
  IF test_package_id IS NOT NULL THEN
    -- Crear una cotización de test
    test_quote := jsonb_build_object(
      'price', 50,
      'message', 'Test de cotización',
      'serviceFee', 10,
      'totalPrice', 70
    );
    
    RAISE NOTICE '🧪 Testing quote notification for package: % shopper: %', test_package_id, shopper_id;
    
    -- Simular que se envía una cotización (cambiar status y agregar quote)
    UPDATE packages
    SET 
      status = 'quote_sent',
      quote = test_quote,
      updated_at = NOW()
    WHERE id = test_package_id;
    
    RAISE NOTICE '✅ Quote test update completed';
  ELSE
    RAISE NOTICE '❌ No matched packages found for test';
  END IF;
END $$;