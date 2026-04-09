
-- 1. notify_traveler_package_status: skip entirely if matched_trip_id is NULL (multi-assignment)
CREATE OR REPLACE FUNCTION public.notify_traveler_package_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  traveler_id UUID;
  traveler_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT := 'package';
  notification_priority TEXT := 'normal';
BEGIN
  -- EARLY RETURN: skip if no matched_trip_id (multi-assignment flow)
  IF NEW.matched_trip_id IS NULL THEN
    RETURN NEW;
  END IF;

  RAISE NOTICE '🔍 TRIGGER FIRED - Package ID: %, Old Trip: %, New Trip: %, Old Status: %, New Status: %', 
    NEW.id, OLD.matched_trip_id, NEW.matched_trip_id, OLD.status, NEW.status;
  
  SELECT t.user_id, CONCAT(p.first_name, ' ', p.last_name) 
  INTO traveler_id, traveler_name
  FROM public.trips t
  LEFT JOIN public.profiles p ON p.id = t.user_id
  WHERE t.id = NEW.matched_trip_id;
  
  RAISE NOTICE '🔍 Traveler found: ID=%, Name=%', traveler_id, traveler_name;
  
  IF traveler_id IS NOT NULL THEN
    
    IF (OLD.matched_trip_id IS NULL AND NEW.matched_trip_id IS NOT NULL) 
       OR (NEW.status = 'matched' AND (OLD.status IS NULL OR OLD.status != 'matched')) THEN
      notification_title := '📦 Nuevo paquete asignado';
      notification_message := CONCAT('¡Tienes un nuevo paquete asignado! "', NEW.item_description, '" de ', NEW.purchase_origin, ' a ', NEW.package_destination, '.');
      notification_priority := 'high';
      
    ELSIF (OLD.status IS NULL OR OLD.status != 'paid') AND NEW.status = 'paid' THEN
      notification_title := '💳 El shopper ha pagado la cotización';
      notification_message := CONCAT('¡Excelente! El shopper ha pagado la cotización para el paquete "', NEW.item_description, '". Ya puedes proceder con la compra.');
      notification_priority := 'high';
      
    ELSIF (OLD.status IS NULL OR OLD.status != 'pending_purchase') AND NEW.status = 'pending_purchase' THEN
      notification_title := '💳 Shopper aceptó y pagó la cotización';
      notification_message := CONCAT('¡Excelente! El shopper ha aceptado y pagado la cotización para "', NEW.item_description, '". Pronto enviará el paquete a tu dirección y te compartirá el comprobante de compra y número de rastreo.');
      notification_priority := 'high';

    ELSIF (NEW.purchase_confirmation IS NOT NULL AND (OLD.purchase_confirmation IS NULL OR OLD.purchase_confirmation IS DISTINCT FROM NEW.purchase_confirmation))
          AND (NEW.purchase_confirmation->>'receipt_url' IS NOT NULL OR NEW.purchase_confirmation->>'filePath' IS NOT NULL) THEN
      notification_title := '🧾 Comprobante de compra subido';
      notification_message := CONCAT('El shopper ha subido el comprobante de compra para "', NEW.item_description, '". Revisa los detalles para coordinar la recepción.');
      notification_priority := 'high';
      
    ELSIF (NEW.tracking_info IS NOT NULL AND (OLD.tracking_info IS NULL OR OLD.tracking_info IS DISTINCT FROM NEW.tracking_info))
          AND (NEW.tracking_info->>'tracking_number' IS NOT NULL) THEN
      notification_title := '📋 Información de seguimiento actualizada';
      notification_message := CONCAT('El shopper ha actualizado la información de seguimiento para "', NEW.item_description, '". Ya puedes rastrear tu paquete.');
      notification_priority := 'high';
      
    ELSIF (NEW.office_delivery IS NOT NULL AND (OLD.office_delivery IS NULL OR OLD.office_delivery IS DISTINCT FROM NEW.office_delivery))
          AND NEW.office_delivery->>'admin_confirmation' IS NOT NULL THEN
      notification_title := '✅ Paquete confirmado en oficina';
      notification_message := CONCAT('¡Perfecto! Favorón ha confirmado la recepción del paquete "', NEW.item_description, '" en nuestras oficinas. Ya puedes crear tu orden de cobro.');
      notification_priority := 'high';
      
    END IF;
    
    IF notification_title IS NOT NULL AND notification_message IS NOT NULL THEN
      PERFORM public.create_notification(
        traveler_id,
        notification_title,
        notification_message,
        notification_type,
        notification_priority,
        NULL,
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
$$;

-- 2. notify_shopper_package_status: skip if status is 'matched' (no notification for that)
CREATE OR REPLACE FUNCTION public.notify_shopper_package_status()
RETURNS TRIGGER
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
  -- EARLY RETURN: 'matched' status doesn't generate shopper notifications
  IF NEW.status = 'matched' AND OLD.status != 'matched' THEN
    RETURN NEW;
  END IF;

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

-- 3. notify_admins_payment_receipt: early return if payment_receipt unchanged
CREATE OR REPLACE FUNCTION public.notify_admins_payment_receipt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
  shopper_name TEXT;
  package_item TEXT;
  is_auto_approved BOOLEAN;
  trust_level TEXT;
  notification_title TEXT;
  notification_message TEXT;
  notification_priority TEXT;
BEGIN
  -- EARLY RETURN: skip if payment_receipt hasn't changed
  IF NEW.payment_receipt IS NOT DISTINCT FROM OLD.payment_receipt THEN
    RETURN NEW;
  END IF;

  -- Solo procesar cuando se sube un nuevo comprobante
  IF NEW.payment_receipt IS NOT NULL THEN
    
    -- Obtener información del shopper
    SELECT 
      CONCAT(p.first_name, ' ', p.last_name),
      p.trust_level::text
    INTO shopper_name, trust_level
    FROM profiles p
    WHERE p.id = NEW.user_id;
    
    package_item := NEW.item_description;
    is_auto_approved := COALESCE((NEW.payment_receipt->>'auto_approved')::boolean, false);
    
    -- Configurar notificación según auto-aprobación
    IF is_auto_approved THEN
      notification_title := '✅ Pago auto-aprobado (auditoría)';
      notification_message := CONCAT(
        shopper_name, ' (', trust_level, ') subió comprobante para "', 
        package_item, '". Auto-aprobado - revisar solo si es necesario.'
      );
      notification_priority := 'normal';
    ELSE
      notification_title := '💳 Nuevo comprobante de pago';
      notification_message := CONCAT(
        shopper_name, ' subió comprobante para "', package_item, '". Requiere aprobación.'
      );
      notification_priority := 'high';
    END IF;
    
    -- Notificar a todos los admins
    FOR admin_user_id IN 
      SELECT user_id FROM user_roles WHERE role = 'admin'
    LOOP
      PERFORM create_notification(
        admin_user_id,
        notification_title,
        notification_message,
        'payment',
        notification_priority,
        NULL,
        jsonb_build_object(
          'package_id', NEW.id,
          'shopper_name', shopper_name,
          'item_description', package_item,
          'quote_total', (NEW.quote->>'totalPrice')::text,
          'auto_approved', is_auto_approved,
          'trust_level', trust_level,
          'status', NEW.status
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. handle_assignment_expiration_on_update: early return for non-matched statuses
CREATE OR REPLACE FUNCTION public.handle_assignment_expiration_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- EARLY RETURN: only relevant when status is 'matched'
  IF NEW.status != 'matched' THEN
    RETURN NEW;
  END IF;

  -- Auto-expire assignment if time has passed during an update operation
  IF NEW.matched_assignment_expires_at IS NOT NULL 
     AND NEW.matched_assignment_expires_at < NOW() 
     AND (OLD.status != 'approved' OR OLD.status IS NULL) THEN
    
    NEW.status = 'approved';
    NEW.matched_trip_id = NULL;
    NEW.matched_assignment_expires_at = NULL;
    
    RAISE NOTICE 'Auto-expired assignment for package % due to expiration', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. set_assignment_expiration: early return for statuses that don't need expiration logic
CREATE OR REPLACE FUNCTION public.set_assignment_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- EARLY RETURN: only relevant for matched/quote_sent transitions
  IF NEW.status NOT IN ('matched', 'quote_sent') AND OLD.status NOT IN ('matched', 'quote_sent') THEN
    RETURN NEW;
  END IF;

  -- Set 24-hour expiration when status changes to 'matched' and matched_trip_id is set
  IF NEW.status = 'matched' 
     AND NEW.matched_trip_id IS NOT NULL
     AND (OLD.status IS NULL OR OLD.status != 'matched' OR OLD.matched_trip_id IS NULL)
     AND NEW.matched_assignment_expires_at IS NULL THEN
    NEW.matched_assignment_expires_at = NOW() + INTERVAL '24 hours';
  END IF;
  
  -- Clear expiration when quote is sent (traveler responded)
  IF NEW.status = 'quote_sent' AND OLD.status = 'matched' THEN
    NEW.matched_assignment_expires_at = NULL;
  END IF;
  
  -- Clear expiration if status changes away from 'matched'
  IF NEW.status != 'matched' AND OLD.status = 'matched' THEN
    NEW.matched_assignment_expires_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. auto_transition_to_in_transit: early return if purchase_confirmation unchanged
CREATE OR REPLACE FUNCTION public.auto_transition_to_in_transit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- EARLY RETURN: skip if purchase_confirmation hasn't changed
  IF NEW.purchase_confirmation IS NOT DISTINCT FROM OLD.purchase_confirmation THEN
    RETURN NEW;
  END IF;

  -- Solo transicionar si:
  -- 1. purchase_confirmation se acaba de agregar (era NULL, ahora no lo es)
  -- 2. El paquete está en un estado pre-tránsito válido
  -- 3. NO está ya en un estado avanzado
  IF NEW.purchase_confirmation IS NOT NULL 
     AND OLD.purchase_confirmation IS NULL
     AND OLD.status IN ('pending_purchase', 'payment_confirmed', 'paid')
     AND NEW.status NOT IN ('received_by_traveler', 'pending_office_confirmation', 
                            'delivered_to_office', 'completed', 'cancelled')
  THEN
    NEW.status := 'in_transit';
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;
