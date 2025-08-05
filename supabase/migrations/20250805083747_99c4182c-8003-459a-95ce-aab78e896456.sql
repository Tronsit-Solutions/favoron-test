-- Función para notificar a administradores cuando se crea un nuevo paquete
CREATE OR REPLACE FUNCTION public.notify_admins_new_package()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_user_id UUID;
  shopper_name TEXT;
  package_item TEXT;
BEGIN
  -- Solo procesar cuando se inserta un nuevo paquete
  IF TG_OP = 'INSERT' THEN
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
      -- Usar la función existente create_notification
      PERFORM create_notification(
        admin_user_id,
        '📦 Nueva solicitud de paquete',
        COALESCE(shopper_name, 'Un usuario') || ' ha enviado una nueva solicitud de paquete: "' || package_item || '" desde ' || NEW.purchase_origin || ' hacia ' || NEW.package_destination,
        'package',
        'high',
        NULL,
        jsonb_build_object(
          'package_id', NEW.id,
          'shopper_name', shopper_name,
          'item_description', package_item,
          'purchase_origin', NEW.purchase_origin,
          'package_destination', NEW.package_destination,
          'status', 'new_package'
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger que se ejecuta cuando se inserta un nuevo paquete
DROP TRIGGER IF EXISTS trigger_notify_admins_new_package ON packages;
CREATE TRIGGER trigger_notify_admins_new_package
  AFTER INSERT ON packages
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_package();