CREATE OR REPLACE FUNCTION public.notify_shopper_package_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  shopper_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT := 'delivery';
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
    notification_type := 'approval';
    
  -- 2. Cuando el paquete pasa a pending_purchase (pago aprobado)
  ELSIF OLD.status != 'pending_purchase' AND NEW.status = 'pending_purchase' THEN
    notification_title := '💳 Tu pago ha sido aprobado exitosamente';
    notification_message := CONCAT('¡Perfecto! Tu pago para el pedido "', NEW.item_description, '" ha sido confirmado. El viajero procederá con la compra de tu producto y te mantendremos informado del progreso.');
    notification_priority := 'high';
    notification_type := 'payment';

  -- 2.b Cuando el shopper acepta la cotización (payment_pending)
  ELSIF OLD.status != 'payment_pending' AND NEW.status = 'payment_pending' THEN
    notification_title := '💳 Aceptaste la cotización';
    notification_message := CONCAT('Has aceptado la cotización para "', NEW.item_description, '". Ahora sube tu comprobante de pago para continuar.');
    notification_priority := 'high';
    notification_type := 'payment';
    
  -- 3. Cuando admin rechaza el paquete CON RAZÓN
  ELSIF OLD.status = 'pending_approval' AND NEW.status = 'rejected' THEN
    notification_title := '❌ Tu pedido ha sido rechazado';
    notification_message := CONCAT('Lo sentimos, tu pedido "', NEW.item_description, '" ha sido rechazado.');
    
    IF NEW.rejection_reason IS NOT NULL AND LENGTH(TRIM(NEW.rejection_reason)) > 0 THEN
      notification_message := notification_message || CONCAT(' Razón: ', NEW.rejection_reason);
    END IF;
    
    notification_message := notification_message || ' Puedes crear una nueva solicitud mejorando los detalles según los comentarios.';
    notification_priority := 'high';
    notification_type := 'package';

  -- 4. Cuando está listo para recoger (pickup)
  ELSIF NEW.status = 'ready_for_pickup' AND OLD.status != 'ready_for_pickup' THEN
    notification_title := '✨ ¡Tu pedido está listo para recoger!';
    notification_message := CONCAT('¡Excelente noticia! Tu pedido "', NEW.item_description, '" ya está en nuestras oficinas listo para que lo recojas. Te esperamos en horario de atención.');
    notification_priority := 'high';
    notification_type := 'delivery';

  -- 5. Cuando está listo para entrega a domicilio
  ELSIF NEW.status = 'ready_for_delivery' AND OLD.status != 'ready_for_delivery' THEN
    notification_title := '🚚 ¡Tu pedido está próximo a llegar!';
    notification_message := CONCAT('¡Buenas noticias! Tu pedido "', NEW.item_description, '" está listo para entrega. Nos pondremos en contacto contigo pronto para coordinar la entrega a tu domicilio.');
    notification_priority := 'high';
    notification_type := 'delivery';
    
  END IF;
  
  -- Crear la notificación con email directo si hay título y mensaje
  IF notification_title IS NOT NULL AND notification_message IS NOT NULL THEN
    PERFORM public.create_notification_with_direct_email(
      NEW.user_id,
      notification_title,
      notification_message,
      notification_type,
      notification_priority,
      'https://favoron.app/dashboard',
      jsonb_build_object(
        'package_id', NEW.id,
        'package_status', NEW.status,
        'change_type', 'package_status_update',
        'rejection_reason', NEW.rejection_reason
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;