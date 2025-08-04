-- Crear bucket para recibos de pago si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Crear políticas para el bucket payment-receipts
INSERT INTO storage.objects (bucket_id, name) VALUES ('payment-receipts', '') 
ON CONFLICT DO NOTHING;

-- Política para que los usuarios puedan subir sus propios recibos
CREATE POLICY "Users can upload their own payment receipts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política para que admins puedan ver todos los recibos
CREATE POLICY "Admins can view all payment receipts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'payment-receipts' AND (
  auth.uid()::text = (storage.foldername(name))[1] OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
));

-- Función para notificar a admins cuando se sube un recibo de pago
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
    
    -- Notificar a todos los admins
    FOR admin_user_id IN 
      SELECT id FROM profiles WHERE role = 'admin'
    LOOP
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        created_at
      ) VALUES (
        admin_user_id,
        'payment_pending_approval',
        'Nuevo comprobante de pago',
        shopper_name || ' ha subido un comprobante de pago para "' || package_item || '"',
        jsonb_build_object(
          'package_id', NEW.id,
          'shopper_name', shopper_name,
          'item_description', package_item,
          'quote_total', (NEW.quote->>'totalPrice')::text
        ),
        NOW()
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger que se ejecuta cuando se actualiza un paquete
DROP TRIGGER IF EXISTS trigger_notify_admins_payment_receipt ON packages;
CREATE TRIGGER trigger_notify_admins_payment_receipt
  AFTER UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_payment_receipt();