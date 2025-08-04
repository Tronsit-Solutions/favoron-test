-- Crear función para notificar a viajeros sobre cambios en paquetes
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
  -- Obtener el traveler_id del viaje asignado
  IF NEW.matched_trip_id IS NOT NULL THEN
    SELECT t.user_id, CONCAT(p.first_name, ' ', p.last_name) 
    INTO traveler_id, traveler_name
    FROM public.trips t
    LEFT JOIN public.profiles p ON p.id = t.user_id
    WHERE t.id = NEW.matched_trip_id;
  END IF;
  
  -- Solo proceder si tenemos un viajero asignado
  IF traveler_id IS NOT NULL THEN
    
    -- 1. Cuando se asigna un paquete por primera vez
    IF OLD.matched_trip_id IS NULL AND NEW.matched_trip_id IS NOT NULL THEN
      notification_title := '📦 Nuevo paquete asignado';
      notification_message := CONCAT('¡Tienes un nuevo paquete asignado! "', NEW.item_description, '" de ', NEW.purchase_origin, ' a ', NEW.package_destination, '.');
      notification_priority := 'high';
      
    -- 2. Cuando el shopper PAGA la cotización (status cambia a 'paid')
    ELSIF OLD.status != 'paid' AND NEW.status = 'paid' THEN
      notification_title := '💳 El shopper ha pagado la cotización';
      notification_message := CONCAT('¡Excelente! El shopper ha pagado la cotización para el paquete "', NEW.item_description, '". Ya puedes proceder con la compra.');
      notification_priority := 'high';
      
    -- 3. Cuando el shopper sube comprobante de compra
    ELSIF (NEW.purchase_confirmation IS NOT NULL AND OLD.purchase_confirmation IS NULL)
          OR (NEW.purchase_confirmation IS NOT NULL 
              AND NEW.purchase_confirmation->>'receipt_url' IS NOT NULL
              AND (OLD.purchase_confirmation IS NULL 
                   OR OLD.purchase_confirmation->>'receipt_url' IS NULL)) THEN
      notification_title := '🧾 Comprobante de compra subido';
      notification_message := CONCAT('El shopper ha subido el comprobante de compra para "', NEW.item_description, '". Revisa los detalles para coordinar la recepción.');
      notification_priority := 'high';
      
    -- 4. Cuando el shopper sube información de seguimiento
    ELSIF (NEW.tracking_info IS NOT NULL AND OLD.tracking_info IS NULL)
          OR (NEW.tracking_info IS NOT NULL 
              AND NEW.tracking_info->>'tracking_number' IS NOT NULL
              AND (OLD.tracking_info IS NULL 
                   OR OLD.tracking_info->>'tracking_number' IS NULL)) THEN
      notification_title := '📋 Información de seguimiento actualizada';
      notification_message := CONCAT('El shopper ha actualizado la información de seguimiento para "', NEW.item_description, '". Ya puedes rastrear tu paquete.');
      notification_priority := 'high';
      
    -- 5. Cuando Favoron confirma que recibió el artículo en oficina
    ELSIF OLD.office_delivery IS NULL AND NEW.office_delivery IS NOT NULL
          AND NEW.office_delivery->>'admin_confirmation' IS NOT NULL THEN
      notification_title := '✅ Paquete confirmado en oficina';
      notification_message := CONCAT('¡Perfecto! Favoron ha confirmado la recepción del paquete "', NEW.item_description, '" en nuestras oficinas. Tu pago está siendo procesado.');
      notification_priority := 'high';
      
    END IF;
    
    -- Crear la notificación si hay título y mensaje
    IF notification_title IS NOT NULL AND notification_message IS NOT NULL THEN
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
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Crear función para notificar a viajeros sobre cambios en viajes
CREATE OR REPLACE FUNCTION public.notify_traveler_trip_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  traveler_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT := 'trip';
  notification_priority TEXT := 'normal';
BEGIN
  -- Obtener nombre del viajero
  SELECT CONCAT(first_name, ' ', last_name) INTO traveler_name
  FROM public.profiles 
  WHERE id = NEW.user_id;
  
  -- 1. Cuando admin aprueba el viaje
  IF OLD.status = 'pending_approval' AND NEW.status = 'approved' THEN
    notification_title := '✈️ Tu viaje ha sido aprobado';
    notification_message := CONCAT('¡Excelente! Tu viaje de ', NEW.from_city, ' a ', NEW.to_city, ' ha sido aprobado. Ya puedes empezar a recibir solicitudes de paquetes.');
    notification_priority := 'high';
    
  END IF;
  
  -- Crear la notificación si hay título y mensaje
  IF notification_title IS NOT NULL AND notification_message IS NOT NULL THEN
    PERFORM public.create_notification(
      NEW.user_id,
      notification_title,
      notification_message,
      notification_type,
      notification_priority,
      NULL, -- action_url se puede agregar después
      jsonb_build_object(
        'trip_id', NEW.id,
        'trip_status', NEW.status,
        'change_type', 'trip_approval'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Crear triggers para activar las notificaciones

-- Trigger para notificaciones de paquetes a viajeros
CREATE OR REPLACE TRIGGER trigger_notify_traveler_package_status
  AFTER UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_traveler_package_status();

-- Trigger para notificaciones de viajes a viajeros  
CREATE OR REPLACE TRIGGER trigger_notify_traveler_trip_status
  AFTER UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_traveler_trip_status();