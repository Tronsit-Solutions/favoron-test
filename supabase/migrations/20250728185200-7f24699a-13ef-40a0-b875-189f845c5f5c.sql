-- Corregir función para establecer search_path seguro
CREATE OR REPLACE FUNCTION public.notify_admins_payment_order()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_user_id UUID;
  traveler_name TEXT;
  amount_formatted TEXT;
BEGIN
  -- Obtener información del traveler
  SELECT CONCAT(first_name, ' ', last_name) INTO traveler_name
  FROM public.profiles 
  WHERE id = NEW.traveler_id;
  
  -- Formatear el monto
  amount_formatted := '$' || TO_CHAR(NEW.amount, 'FM999,999,999.00');
  
  -- Obtener todos los admin user IDs y crear notificaciones para cada uno
  FOR admin_user_id IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    -- Crear notificación usando la función existente
    PERFORM public.create_notification(
      admin_user_id,
      '💰 Nueva solicitud de pago',
      CONCAT('Solicitud de pago de ', COALESCE(traveler_name, 'Usuario'), ' por ', amount_formatted, '. Banco: ', NEW.bank_name),
      'payment',
      'high',
      '/admin/payments',
      jsonb_build_object(
        'payment_order_id', NEW.id,
        'trip_id', NEW.trip_id,
        'traveler_id', NEW.traveler_id,
        'amount', NEW.amount,
        'bank_name', NEW.bank_name,
        'account_holder', NEW.bank_account_holder
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;