
-- 1) RPC: accept_quote(_package_id)
CREATE OR REPLACE FUNCTION public.accept_quote(_package_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pkg RECORD;
  v_traveler_id uuid;
BEGIN
  -- Obtener paquete y bloquear fila para evitar condiciones de carrera
  SELECT p.*
  INTO v_pkg
  FROM public.packages p
  WHERE p.id = _package_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Paquete no encontrado';
  END IF;

  -- Validar que quien llama sea el shopper dueño del paquete
  IF auth.uid() IS NULL OR auth.uid() <> v_pkg.user_id THEN
    RAISE EXCEPTION 'No tienes permisos para aceptar esta cotización';
  END IF;

  -- Validar estado y expiración
  IF v_pkg.status IS DISTINCT FROM 'quote_sent' THEN
    RAISE EXCEPTION 'Solo puedes aceptar cotizaciones en estado quote_sent';
  END IF;

  IF v_pkg.quote_expires_at IS NOT NULL AND v_pkg.quote_expires_at < NOW() THEN
    RAISE EXCEPTION 'La cotización ha expirado';
  END IF;

  -- Actualizar a payment_pending
  UPDATE public.packages
  SET 
    status = 'payment_pending',
    updated_at = NOW()
  WHERE id = _package_id;

  -- Notificar al shopper: subir comprobante
  PERFORM public.create_notification(
    v_pkg.user_id,
    '💳 Sube tu comprobante de pago',
    CONCAT('Aceptaste la cotización para "', v_pkg.item_description, '". Ahora sube tu comprobante para continuar.'),
    'payment',
    'high',
    NULL,
    jsonb_build_object(
      'package_id', _package_id,
      'next_action', 'upload_payment_receipt'
    )
  );

  -- Notificar al viajero (si hay trip asignado)
  IF v_pkg.matched_trip_id IS NOT NULL THEN
    SELECT t.user_id INTO v_traveler_id
    FROM public.trips t
    WHERE t.id = v_pkg.matched_trip_id;

    IF v_traveler_id IS NOT NULL THEN
      PERFORM public.create_notification(
        v_traveler_id,
        '✅ Cotización aceptada',
        CONCAT('El shopper aceptó tu cotización para "', v_pkg.item_description, '". Pendiente comprobante de pago.'),
        'package',
        'high',
        NULL,
        jsonb_build_object(
          'package_id', _package_id,
          'trip_id', v_pkg.matched_trip_id,
          'payment_status', 'pending_payment'
        )
      );
    END IF;
  END IF;
END;
$function$;

-- 2) Actualizar notify_shopper_package_status para manejar payment_pending
CREATE OR REPLACE FUNCTION public.notify_shopper_package_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

  -- 2.b NUEVO: Cuando el shopper acepta la cotización (payment_pending)
  ELSIF OLD.status != 'payment_pending' AND NEW.status = 'payment_pending' THEN
    notification_title := '💳 Aceptaste la cotización';
    notification_message := CONCAT('Has aceptado la cotización para "', NEW.item_description, '". Ahora sube tu comprobante de pago para continuar.');
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
    
  -- 5. Cuando el viajero confirma que recibió el paquete (traveler_confirmation)
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
      NULL, -- action_url
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

-- 3) Actualizar notify_traveler_package_status para manejar payment_pending
CREATE OR REPLACE FUNCTION public.notify_traveler_package_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    
    -- 1. Asignación de paquete
    IF (OLD.matched_trip_id IS NULL AND NEW.matched_trip_id IS NOT NULL) 
       OR (NEW.status = 'matched' AND (OLD.status IS NULL OR OLD.status != 'matched')) THEN
      notification_title := '📦 Nuevo paquete asignado';
      notification_message := CONCAT('¡Tienes un nuevo paquete asignado! "', NEW.item_description, '" de ', NEW.purchase_origin, ' a ', NEW.package_destination, '.');
      notification_priority := 'high';
      
    -- 2. Pago confirmado (estado 'paid' heredado)
    ELSIF (OLD.status IS NULL OR OLD.status != 'paid') AND NEW.status = 'paid' THEN
      notification_title := '💳 El shopper ha pagado la cotización';
      notification_message := CONCAT('¡Excelente! El shopper ha pagado la cotización para el paquete "', NEW.item_description, '". Ya puedes proceder con la compra.');
      notification_priority := 'high';
      
    -- 2.5 Pago aprobado (pending_purchase)
    ELSIF (OLD.status IS NULL OR OLD.status != 'pending_purchase') AND NEW.status = 'pending_purchase' THEN
      notification_title := '✅ Shopper aceptó y pagó la cotización';
      notification_message := CONCAT('¡Excelente! El shopper ha aceptado y pagado la cotización para "', NEW.item_description, '". Pronto te compartirá el comprobante de compra y la información de seguimiento.');
      notification_priority := 'high';

    -- 2.b NUEVO: Aceptación previa al pago (payment_pending)
    ELSIF (OLD.status IS NULL OR OLD.status != 'payment_pending') AND NEW.status = 'payment_pending' THEN
      notification_title := '✅ Shopper aceptó tu cotización';
      notification_message := CONCAT('El shopper aceptó tu cotización para "', NEW.item_description, '". Pendiente comprobante de pago.');
      notification_priority := 'high';
      
    -- 3. Comprobante de compra subido
    ELSIF (NEW.purchase_confirmation IS NOT NULL AND (OLD.purchase_confirmation IS NULL OR OLD.purchase_confirmation IS DISTINCT FROM NEW.purchase_confirmation))
          AND (NEW.purchase_confirmation->>'receipt_url' IS NOT NULL OR NEW.purchase_confirmation->>'filePath' IS NOT NULL) THEN
      notification_title := '🧾 Comprobante de compra subido';
      notification_message := CONCAT('El shopper ha subido el comprobante de compra para "', NEW.item_description, '". Revisa los detalles para coordinar la recepción.');
      notification_priority := 'high';
      
    -- 4. Tracking info subida
    ELSIF (NEW.tracking_info IS NOT NULL AND (OLD.tracking_info IS NULL OR OLD.tracking_info IS DISTINCT FROM NEW.tracking_info))
          AND (NEW.tracking_info->>'tracking_number' IS NOT NULL) THEN
      notification_title := '📋 Información de seguimiento actualizada';
      notification_message := CONCAT('El shopper ha actualizado la información de seguimiento para "', NEW.item_description, '". Ya puedes rastrear tu paquete.');
      notification_priority := 'high';
      
    -- 5. Confirmación en oficina
    ELSIF (NEW.office_delivery IS NOT NULL AND (OLD.office_delivery IS NULL OR OLD.office_delivery IS DISTINCT FROM NEW.office_delivery))
          AND NEW.office_delivery->>'admin_confirmation' IS NOT NULL THEN
      notification_title := '✅ Paquete confirmado en oficina';
      notification_message := CONCAT('¡Perfecto! Favorón ha confirmado la recepción del paquete "', NEW.item_description, '" en nuestras oficinas. Tu pago está siendo procesado.');
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
        NULL, -- action_url
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
