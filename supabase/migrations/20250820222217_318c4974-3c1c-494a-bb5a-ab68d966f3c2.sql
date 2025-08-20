-- Corregir la función update_trip_payment_accumulator para no cambiar el status del trip
-- El problema es que está intentando cambiar el status a 'completed' que no está permitido
-- Solo debe actualizar el acumulador de pagos, no el status del trip

CREATE OR REPLACE FUNCTION public.update_trip_payment_accumulator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  trip_traveler_id UUID;
  tip_amount DECIMAL;
  total_packages INTEGER;
  delivered_packages INTEGER;
  all_packages_delivered BOOLEAN;
BEGIN
  -- Solo procesar cuando el status cambia a delivered_to_office con ambas confirmaciones
  IF (NEW.status = 'delivered_to_office' 
      AND NEW.office_delivery IS NOT NULL 
      AND NEW.office_delivery->>'traveler_declaration' IS NOT NULL
      AND NEW.office_delivery->>'admin_confirmation' IS NOT NULL)
     AND (OLD.status != 'delivered_to_office' 
          OR OLD.office_delivery IS NULL 
          OR OLD.office_delivery->>'traveler_declaration' IS NULL
          OR OLD.office_delivery->>'admin_confirmation' IS NULL) THEN
    
    -- Obtener el ID del viajero del trip
    SELECT t.user_id INTO trip_traveler_id
    FROM public.trips t
    WHERE t.id = NEW.matched_trip_id;
    
    -- Obtener el monto del tip de este paquete
    tip_amount := COALESCE((NEW.quote->>'price')::DECIMAL, 0);
    
    -- Contar total de paquetes en el trip (excluyendo rechazados/cancelados)
    SELECT COUNT(*) INTO total_packages
    FROM public.packages
    WHERE matched_trip_id = NEW.matched_trip_id
      AND status NOT IN ('rejected', 'cancelled');
    
    -- Contar paquetes entregados (con ambas confirmaciones)
    SELECT COUNT(*) INTO delivered_packages
    FROM public.packages
    WHERE matched_trip_id = NEW.matched_trip_id 
      AND status = 'delivered_to_office'
      AND office_delivery IS NOT NULL
      AND office_delivery->>'traveler_declaration' IS NOT NULL
      AND office_delivery->>'admin_confirmation' IS NOT NULL;
    
    -- Determinar si todos los paquetes están entregados
    all_packages_delivered := (total_packages > 0 AND delivered_packages = total_packages);
    
    -- Insertar o actualizar el acumulador (SIN CAMBIAR EL STATUS DEL TRIP)
    INSERT INTO public.trip_payment_accumulator (
      trip_id, 
      traveler_id, 
      accumulated_amount, 
      delivered_packages_count,
      total_packages_count,
      all_packages_delivered
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
      
    -- NO ACTUALIZAR EL STATUS DEL TRIP AQUÍ
    -- El status del trip se cambiará manualmente cuando el admin procese los pagos
  END IF;
  
  RETURN NEW;
END;
$function$;