-- Actualizar el trigger para notificar al shopper cuando el viajero confirma recepción
CREATE OR REPLACE FUNCTION public.notify_shopper_package_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  shopper_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT := 'package';
  notification_priority TEXT := 'normal';
BEGIN
  -- Obtener nombre del shopper
  SELECT CONCAT(first_name, ' ', last_name) INTO shopper_name
  FROM public.profiles 
  WHERE id = NEW.user_id;
  
  -- 1. Cuando admin aprueba el paquete
  IF OLD.status = 'pending_approval' AND NEW.status = 'approved' THEN
    notification_title := '✅ Tu pedido ha sido aprobado';
    notification_message := CONCAT('¡Excelente! Tu pedido "', NEW.item_description, '" ha sido aprobado por nuestro equipo. Pronto será asignado a un viajero.');
    notification_priority := 'high';
    
  -- 2. Cuando el paquete pasa a pending_purchase (pago aprobado)
  ELSIF OLD.status != 'pending_purchase' AND NEW.status = 'pending_purchase' THEN
    notification_title := '💳 Tu pago ha sido aprobado exitosamente';
    notification_message := CONCAT('¡Perfecto! Tu pago para el pedido "', NEW.item_description, '" ha sido aprobado. Ahora puedes proceder a realizar la compra del paquete según las instrucciones recibidas.');
    notification_priority := 'high';
    
  -- 3. Cuando admin rechaza el paquete
  ELSIF OLD.status = 'pending_approval' AND NEW.status = 'rejected' THEN
    notification_title := '❌ Tu pedido ha sido rechazado';
    notification_message := CONCAT('Lo sentimos, tu pedido "', NEW.item_description, '" no pudo ser aprobado. Revisa los detalles o contacta a soporte.');
    notification_priority := 'high';
    
  -- 4. Cuando un viajero acepta y envía cotización
  ELSIF OLD.status != 'quote_sent' AND NEW.status = 'quote_sent' THEN
    notification_title := '💰 Nueva cotización recibida';
    notification_message := CONCAT('¡Buenas noticias! Un viajero ha enviado una cotización para tu pedido "', NEW.item_description, '". Revisa los detalles y acepta si estás conforme.');
    notification_priority := 'high';
    
  -- 5. Cuando el viajero confirma que recibió el paquete (actualizado para detectar traveler_confirmation)
  ELSIF (NEW.traveler_confirmation IS NOT NULL AND OLD.traveler_confirmation IS NULL)
        OR (NEW.traveler_confirmation IS NOT NULL 
            AND NEW.traveler_confirmation->>'confirmed_at' IS NOT NULL
            AND (OLD.traveler_confirmation IS NULL 
                 OR OLD.traveler_confirmation->>'confirmed_at' IS NULL)) THEN
    notification_title := '📦 Tu pedido ha sido recibido por el viajero';
    notification_message := CONCAT('El viajero ha confirmado que recibió tu pedido "', NEW.item_description, '". Tu paquete está en camino a Guatemala.');
    notification_priority := 'high';
    
  -- 6. Cuando se confirma por ambos que llegó a oficina
  ELSIF OLD.office_delivery IS NULL AND NEW.office_delivery IS NOT NULL
        AND NEW.office_delivery->>'traveler_declaration' IS NOT NULL
        AND NEW.office_delivery->>'admin_confirmation' IS NOT NULL THEN
    notification_title := '🏢 Tu pedido llegó a nuestras oficinas';
    notification_message := CONCAT('¡Perfecto! Tu pedido "', NEW.item_description, '" ha llegado a nuestras oficinas y ha sido confirmado. Pronto estará listo para entrega.');
    notification_priority := 'high';
    
  -- 7. Cuando está listo para recibir (pickup o delivery)
  ELSIF NEW.status = 'ready_for_pickup' THEN
    notification_title := '✨ Tu pedido está listo para recoger';
    notification_message := CONCAT('¡Tu pedido "', NEW.item_description, '" está listo! Puedes pasar a recogerlo en nuestras oficinas.');
    notification_priority := 'high';
    
  ELSIF NEW.status = 'ready_for_delivery' THEN
    notification_title := '🚚 Tu pedido está listo para entrega';
    notification_message := CONCAT('¡Tu pedido "', NEW.item_description, '" está listo! Nos pondremos en contacto contigo para coordinar la entrega.');
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
        'package_id', NEW.id,
        'package_status', NEW.status,
        'change_type', 'status_update'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;