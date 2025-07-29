-- Crear función que valide si todos los paquetes de un viaje están entregados
CREATE OR REPLACE FUNCTION public.check_all_packages_delivered(_trip_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  total_packages INTEGER;
  delivered_packages INTEGER;
BEGIN
  -- Contar total de paquetes del viaje
  SELECT COUNT(*) INTO total_packages
  FROM public.packages
  WHERE matched_trip_id = _trip_id
    AND status NOT IN ('rejected', 'cancelled');
  
  -- Contar paquetes entregados (con ambas confirmaciones)
  SELECT COUNT(*) INTO delivered_packages
  FROM public.packages
  WHERE matched_trip_id = _trip_id 
    AND status = 'delivered_to_office'
    AND office_delivery IS NOT NULL
    AND office_delivery->>'traveler_declaration' IS NOT NULL
    AND office_delivery->>'admin_confirmation' IS NOT NULL;
  
  -- Retornar true solo si todos los paquetes están entregados
  RETURN (total_packages > 0 AND delivered_packages = total_packages);
END;
$function$

-- Modificar el trigger para que solo cree/actualice el acumulador si todos los paquetes están entregados
CREATE OR REPLACE FUNCTION public.update_trip_payment_accumulator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  trip_traveler_id UUID;
  tip_amount DECIMAL;
  total_packages INTEGER;
  delivered_packages INTEGER;
  all_packages_delivered BOOLEAN;
BEGIN
  -- Solo procesar si el paquete se marca como entregado en oficina 
  -- CON DOBLE CONFIRMACIÓN: traveler_declaration Y admin_confirmation
  IF (NEW.status = 'delivered_to_office' 
      AND NEW.office_delivery IS NOT NULL 
      AND NEW.office_delivery->>'traveler_declaration' IS NOT NULL
      AND NEW.office_delivery->>'admin_confirmation' IS NOT NULL)
     AND (OLD.status != 'delivered_to_office' 
          OR OLD.office_delivery IS NULL 
          OR OLD.office_delivery->>'traveler_declaration' IS NULL
          OR OLD.office_delivery->>'admin_confirmation' IS NULL) THEN
    
    -- Obtener el traveler_id del viaje matched
    SELECT t.user_id INTO trip_traveler_id
    FROM public.trips t
    WHERE t.id = NEW.matched_trip_id;
    
    -- Obtener el tip del quote
    tip_amount := COALESCE((NEW.quote->>'price')::DECIMAL, 0);
    
    -- Contar total de paquetes del viaje (excluyendo rechazados y cancelados)
    SELECT COUNT(*) INTO total_packages
    FROM public.packages
    WHERE matched_trip_id = NEW.matched_trip_id
      AND status NOT IN ('rejected', 'cancelled');
    
    -- Contar paquetes entregados del viaje (que tengan AMBAS confirmaciones)
    SELECT COUNT(*) INTO delivered_packages
    FROM public.packages
    WHERE matched_trip_id = NEW.matched_trip_id 
      AND status = 'delivered_to_office'
      AND office_delivery IS NOT NULL
      AND office_delivery->>'traveler_declaration' IS NOT NULL
      AND office_delivery->>'admin_confirmation' IS NOT NULL;
    
    -- Verificar si todos los paquetes están entregados
    all_packages_delivered := (total_packages > 0 AND delivered_packages = total_packages);
    
    -- Insertar o actualizar el acumulador SOLO si hay paquetes entregados
    -- (pero no necesariamente todos)
    INSERT INTO public.trip_payment_accumulator (
      trip_id, 
      traveler_id, 
      accumulated_amount, 
      delivered_packages_count,
      total_packages_count,
      all_packages_delivered  -- Agregar esta bandera
    )
    VALUES (
      NEW.matched_trip_id, 
      trip_traveler_id, 
      tip_amount,
      delivered_packages,
      total_packages,
      all_packages_delivered
    )
    ON CONFLICT (trip_id, traveler_id) 
    DO UPDATE SET
      accumulated_amount = trip_payment_accumulator.accumulated_amount + tip_amount,
      delivered_packages_count = delivered_packages,
      total_packages_count = total_packages,
      all_packages_delivered = all_packages_delivered,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$

-- Agregar la columna all_packages_delivered a trip_payment_accumulator
ALTER TABLE public.trip_payment_accumulator 
ADD COLUMN IF NOT EXISTS all_packages_delivered boolean DEFAULT false;

-- Crear un trigger que evite crear payment_orders si no todos los paquetes están entregados
CREATE OR REPLACE FUNCTION public.validate_payment_order_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  all_delivered BOOLEAN;
BEGIN
  -- Verificar si todos los paquetes del viaje están entregados
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