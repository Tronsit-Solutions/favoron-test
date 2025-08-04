-- Corregir el mensaje de notificación para pending_purchase
-- El viajero debe saber que el shopper aceptó y pagó, y que pronto recibirá comprobante

CREATE OR REPLACE FUNCTION public.notify_traveler_package_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  traveler_id UUID;
  traveler_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT := 'package';
  notification_priority TEXT := 'normal';
BEGIN
  -- Log para debugging
  RAISE NOTICE '🔍 TRIGGER FIRED - Package ID: %, Old Trip: %, New Trip: %, Old Status: %, New Status: %', 
    NEW.id, OLD.matched_trip_id, NEW.matched_trip_id, OLD.status, NEW.status;
  
  -- Obtener el traveler_id del viaje asignado
  IF NEW.matched_trip_id IS NOT NULL THEN
    SELECT t.user_id, CONCAT(p.first_name, ' ', p.last_name) 
    INTO traveler_id, traveler_name
    FROM public.trips t
    LEFT JOIN public.profiles p ON p.id = t.user_id
    WHERE t.id = NEW.matched_trip_id;
    
    RAISE NOTICE '🔍 Traveler found: ID=%, Name=%', traveler_id, traveler_name;
  END IF;
  
  -- Solo proceder si tenemos un viajero asignado
  IF traveler_id IS NOT NULL THEN
    
    -- 1. Cuando se asigna un paquete por primera vez (matched_trip_id cambia O status cambia a matched)
    IF (OLD.matched_trip_id IS NULL AND NEW.matched_trip_id IS NOT NULL) 
       OR (NEW.status = 'matched' AND (OLD.status IS NULL OR OLD.status != 'matched')) THEN
      notification_title := '📦 Nuevo paquete asignado';
      notification_message := CONCAT('¡Tienes un nuevo paquete asignado! "', NEW.item_description, '" de ', NEW.purchase_origin, ' a ', NEW.package_destination, '.');
      notification_priority := 'high';
      
      RAISE NOTICE '🔍 CASE 1 - Package assignment detected';
      
    -- 2. Cuando el shopper PAGA la cotización (status cambia a 'paid')
    ELSIF (OLD.status IS NULL OR OLD.status != 'paid') AND NEW.status = 'paid' THEN
      notification_title := '💳 El shopper ha pagado la cotización';
      notification_message := CONCAT('¡Excelente! El shopper ha pagado la cotización para el paquete "', NEW.item_description, '". Ya puedes proceder con la compra.');
      notification_priority := 'high';
      
      RAISE NOTICE '🔍 CASE 2 - Payment detected';
      
    -- 3. CORREGIDO: Cuando el paquete pasa a pending_purchase (shopper aceptó y pagó)
    ELSIF (OLD.status IS NULL OR OLD.status != 'pending_purchase') AND NEW.status = 'pending_purchase' THEN
      notification_title := '✅ Shopper aceptó y pagó la cotización';
      notification_message := CONCAT('¡Excelente! El shopper ha aceptado y pagado la cotización para "', NEW.item_description, '". Pronto te compartirá el comprobante de compra y la información de seguimiento.');
      notification_priority := 'high';
      
      RAISE NOTICE '🔍 CASE 2.5 - Shopper accepted and paid quote (pending_purchase) detected';
      
    -- 4. Cuando el shopper sube comprobante de compra
    ELSIF (NEW.purchase_confirmation IS NOT NULL AND (OLD.purchase_confirmation IS NULL OR OLD.purchase_confirmation IS DISTINCT FROM NEW.purchase_confirmation))
          AND (NEW.purchase_confirmation->>'receipt_url' IS NOT NULL OR NEW.purchase_confirmation->>'filePath' IS NOT NULL) THEN
      notification_title := '🧾 Comprobante de compra subido';
      notification_message := CONCAT('El shopper ha subido el comprobante de compra para "', NEW.item_description, '". Revisa los detalles para coordinar la recepción.');
      notification_priority := 'high';
      
      RAISE NOTICE '🔍 CASE 3 - Purchase confirmation detected';
      
    -- 5. Cuando el shopper sube información de seguimiento
    ELSIF (NEW.tracking_info IS NOT NULL AND (OLD.tracking_info IS NULL OR OLD.tracking_info IS DISTINCT FROM NEW.tracking_info))
          AND (NEW.tracking_info->>'tracking_number' IS NOT NULL) THEN
      notification_title := '📋 Información de seguimiento actualizada';
      notification_message := CONCAT('El shopper ha actualizado la información de seguimiento para "', NEW.item_description, '". Ya puedes rastrear tu paquete.');
      notification_priority := 'high';
      
      RAISE NOTICE '🔍 CASE 4 - Tracking info detected';
      
    -- 6. Cuando Favoron confirma que recibió el artículo en oficina
    ELSIF (NEW.office_delivery IS NOT NULL AND (OLD.office_delivery IS NULL OR OLD.office_delivery IS DISTINCT FROM NEW.office_delivery))
          AND NEW.office_delivery->>'admin_confirmation' IS NOT NULL THEN
      notification_title := '✅ Paquete confirmado en oficina';
      notification_message := CONCAT('¡Perfecto! Favorón ha confirmado la recepción del paquete "', NEW.item_description, '" en nuestras oficinas. Tu pago está siendo procesado.');
      notification_priority := 'high';
      
      RAISE NOTICE '🔍 CASE 5 - Office delivery confirmed';
      
    END IF;
    
    -- Crear la notificación si hay título y mensaje
    IF notification_title IS NOT NULL AND notification_message IS NOT NULL THEN
      RAISE NOTICE '🔍 Creating notification: Title=%, Message=%, Traveler ID=%', notification_title, notification_message, traveler_id;
      
      PERFORM public.create_notification(
        traveler_id,
        notification_title,
        notification_message,
        notification_type,
        notification_priority,
        NULL, -- action_url se puede agregar después
        jsonb_build_object(
          'package_id', NEW.id,
          'trip_id', NEW.matched_trip_id,
          'package_status', NEW.status,
          'change_type', 'package_update'
        )
      );
      
      RAISE NOTICE '✅ Notification created successfully for traveler %', traveler_id;
    ELSE
      RAISE NOTICE '⚠️ No notification conditions met';
    END IF;
    
  ELSE
    RAISE NOTICE '⚠️ No traveler found for package %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;