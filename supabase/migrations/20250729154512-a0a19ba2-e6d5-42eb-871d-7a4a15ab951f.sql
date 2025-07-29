-- Crear función de validación para las órdenes de pago
CREATE OR REPLACE FUNCTION public.validate_payment_order_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  all_delivered BOOLEAN;
BEGIN
  SELECT public.check_all_packages_delivered(NEW.trip_id) INTO all_delivered;
  
  IF NOT all_delivered THEN
    RAISE EXCEPTION 'No se puede crear una orden de pago hasta que todos los paquetes del viaje estén entregados';
  END IF;
  
  RETURN NEW;
END;
$function$

-- Crear el trigger para payment_orders
DROP TRIGGER IF EXISTS validate_payment_order_trigger ON public.payment_orders;
CREATE TRIGGER validate_payment_order_trigger
  BEFORE INSERT ON public.payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_payment_order_creation();