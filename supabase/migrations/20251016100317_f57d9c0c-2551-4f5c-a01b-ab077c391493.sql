-- Actualizar trigger de notificaciones para distinguir pagos auto-aprobados
-- Los pagos de usuarios 'confiable' o 'prime' generan notificaciones de auditoría (prioridad normal)
-- Los pagos de usuarios 'basic' generan notificaciones de aprobación (prioridad alta)

CREATE OR REPLACE FUNCTION public.notify_admins_payment_receipt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
  -- Solo procesar cuando se sube un nuevo comprobante
  IF NEW.payment_receipt IS NOT NULL 
     AND (OLD.payment_receipt IS NULL OR OLD.payment_receipt IS DISTINCT FROM NEW.payment_receipt) THEN
    
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