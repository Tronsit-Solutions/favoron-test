-- Test directo de la función de notificación
DO $$
DECLARE
  traveler_id UUID;
  notification_id UUID;
BEGIN
  -- Obtener un viajero real
  SELECT user_id INTO traveler_id
  FROM trips 
  WHERE status = 'approved'
  LIMIT 1;
  
  IF traveler_id IS NOT NULL THEN
    -- Crear una notificación de test directamente
    SELECT public.create_notification(
      traveler_id,
      '📦 TEST - Nuevo paquete asignado',
      'Este es un test para verificar que las notificaciones funcionan correctamente.',
      'package',
      'high',
      NULL,
      '{"test": true}'::jsonb
    ) INTO notification_id;
    
    RAISE NOTICE 'Test notification created with ID: % for traveler: %', notification_id, traveler_id;
  ELSE
    RAISE NOTICE 'No travelers found for test';
  END IF;
END $$;