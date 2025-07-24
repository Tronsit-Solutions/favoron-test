-- Fix security warnings from Supabase Security Advisor

-- 1. Fix Function Search Path Mutable warning for update_trip_payment_accumulator
-- This function needs to have search_path set properly for security
DROP TRIGGER IF EXISTS update_trip_payment_accumulator_trigger ON packages;
DROP FUNCTION IF EXISTS public.update_trip_payment_accumulator();

CREATE OR REPLACE FUNCTION public.update_trip_payment_accumulator()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'  -- Fix: Set search_path explicitly for security
AS $function$
DECLARE
  trip_traveler_id UUID;
  tip_amount DECIMAL;
  total_packages INTEGER;
  delivered_packages INTEGER;
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
    
    -- Contar total de paquetes del viaje
    SELECT COUNT(*) INTO total_packages
    FROM public.packages
    WHERE matched_trip_id = NEW.matched_trip_id;
    
    -- Contar paquetes entregados del viaje (que tengan AMBAS confirmaciones)
    SELECT COUNT(*) INTO delivered_packages
    FROM public.packages
    WHERE matched_trip_id = NEW.matched_trip_id 
      AND status = 'delivered_to_office'
      AND office_delivery IS NOT NULL
      AND office_delivery->>'traveler_declaration' IS NOT NULL
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

-- Recreate the trigger
CREATE TRIGGER update_trip_payment_accumulator_trigger
  AFTER UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trip_payment_accumulator();