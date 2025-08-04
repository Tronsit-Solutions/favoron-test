-- Corregir el tipo de notificación en la función notify_admins_payment_receipt
CREATE OR REPLACE FUNCTION public.notify_admins_payment_receipt()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_user_id UUID;
  shopper_name TEXT;
  package_item TEXT;
BEGIN
  -- Solo procesar cuando el status cambia a payment_pending_approval
  IF NEW.status = 'payment_pending_approval' AND (OLD.status IS NULL OR OLD.status != 'payment_pending_approval') THEN
    -- Obtener información del shopper
    SELECT CONCAT(first_name, ' ', last_name) INTO shopper_name
    FROM profiles 
    WHERE id = NEW.user_id;
    
    -- Obtener descripción del item
    package_item := NEW.item_description;
    
    -- Notificar a todos los admins usando la tabla user_roles
    FOR admin_user_id IN 
      SELECT user_id FROM user_roles WHERE role = 'admin'
    LOOP
      -- Usar la función existente create_notification con tipo 'payment' en lugar de 'payment_pending_approval'
      PERFORM create_notification(
        admin_user_id,
        'Nuevo comprobante de pago',
        shopper_name || ' ha subido un comprobante de pago para "' || package_item || '"',
        'payment',  -- Cambiar a 'payment' que está permitido
        'high',
        NULL,
        jsonb_build_object(
          'package_id', NEW.id,
          'shopper_name', shopper_name,
          'item_description', package_item,
          'quote_total', (NEW.quote->>'totalPrice')::text,
          'status', 'payment_pending_approval'  -- Agregar el status específico en metadata
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;