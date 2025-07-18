-- Actualizar el trigger para contar correctamente paquetes entregados en oficina
CREATE OR REPLACE FUNCTION public.update_trip_payment_accumulator()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  trip_traveler_id UUID;
  tip_amount DECIMAL;
  total_packages INTEGER;
  delivered_packages INTEGER;
BEGIN
  -- Solo procesar si el paquete se marca como entregado en oficina o completado
  IF (NEW.status IN ('delivered_to_office', 'completed') AND NEW.office_delivery IS NOT NULL) 
     AND (OLD.office_delivery IS NULL OR OLD.status NOT IN ('delivered_to_office', 'completed')) THEN
    
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
    
    -- Contar paquetes entregados del viaje (que tengan office_delivery confirmado)
    SELECT COUNT(*) INTO delivered_packages
    FROM public.packages
    WHERE matched_trip_id = NEW.matched_trip_id 
      AND office_delivery IS NOT NULL;
    
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

-- Corregir manualmente el registro existente
UPDATE public.trip_payment_accumulator 
SET delivered_packages_count = 2
WHERE trip_id = '664f3b62-ff16-42a4-b614-fde62ce3cbe6';