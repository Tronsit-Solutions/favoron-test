-- Agregar nuevo status para confirmación de entrega tipo escrow
-- El viajero declara entrega, admin debe confirmar antes del pago

-- Agregar el nuevo status pending_office_confirmation
-- No necesitamos modificar la estructura de office_delivery ya que es JSONB
-- y podemos almacenar tanto la declaración del viajero como la confirmación del admin

-- Actualizar el trigger para que solo se active cuando ADMIN confirma la entrega
-- No cuando el viajero la declara

DROP TRIGGER IF EXISTS update_trip_payment_accumulator_trigger ON packages;

CREATE OR REPLACE FUNCTION public.update_trip_payment_accumulator()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
DECLARE
  trip_traveler_id UUID;
  tip_amount DECIMAL;
  total_packages INTEGER;
  delivered_packages INTEGER;
BEGIN
  -- Solo procesar si el paquete se marca como entregado en oficina (confirmado por admin)
  -- Y el office_delivery tiene tanto traveler_declaration como admin_confirmation
  IF (NEW.status = 'delivered_to_office' 
      AND NEW.office_delivery IS NOT NULL 
      AND NEW.office_delivery->>'admin_confirmation' IS NOT NULL)
     AND (OLD.status != 'delivered_to_office' OR OLD.office_delivery IS NULL OR OLD.office_delivery->>'admin_confirmation' IS NULL) THEN
    
    -- Obtener el traveler_id del viaje matched
    SELECT t.user_id INTO trip_traveler_id
    FROM public.trips t
    WHERE t.id = NEW.matched_trip_id;
    
    -- Obtener el tip del quote
    tip_amount := COALESCE((NEW.quote->>'price')::DECIMAL, 0);
    
    -- Contar total de paquetes del viaje
    SELECT COUNT(*) INTO total_packages
    FROM public.packages
    WHERE matched_trip_id = NEW.matched_trip_id;
    
    -- Contar paquetes entregados del viaje (que tengan admin_confirmation)
    SELECT COUNT(*) INTO delivered_packages
    FROM public.packages
    WHERE matched_trip_id = NEW.matched_trip_id 
      AND status = 'delivered_to_office'
      AND office_delivery IS NOT NULL
      AND office_delivery->>'admin_confirmation' IS NOT NULL;
    
    -- Insertar o actualizar el acumulador
    INSERT INTO public.trip_payment_accumulator (
      trip_id, 
      traveler_id, 
      accumulated_amount, 
      delivered_packages_count,
      total_packages_count
    )
    VALUES (
      NEW.matched_trip_id, 
      trip_traveler_id, 
      tip_amount,
      delivered_packages,
      total_packages
    )
    ON CONFLICT (trip_id, traveler_id) 
    DO UPDATE SET
      accumulated_amount = trip_payment_accumulator.accumulated_amount + tip_amount,
      delivered_packages_count = delivered_packages,
      total_packages_count = total_packages,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recrear el trigger
CREATE TRIGGER update_trip_payment_accumulator_trigger
  AFTER UPDATE ON public.packages
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_trip_payment_accumulator();