-- Corregir función con search_path seguro
CREATE OR REPLACE FUNCTION public.check_trip_completion()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  trip_id_to_check UUID;
  total_packages INTEGER;
  paid_packages INTEGER;
BEGIN
  -- Solo procesar si el paquete cambió a estado 'paid'
  IF NEW.status = 'paid' AND OLD.status != 'paid' AND NEW.matched_trip_id IS NOT NULL THEN
    trip_id_to_check := NEW.matched_trip_id;
    
    -- Contar total de paquetes del viaje
    SELECT COUNT(*) INTO total_packages
    FROM public.packages
    WHERE matched_trip_id = trip_id_to_check;
    
    -- Contar paquetes pagados del viaje
    SELECT COUNT(*) INTO paid_packages
    FROM public.packages
    WHERE matched_trip_id = trip_id_to_check 
      AND status = 'paid';
    
    -- Si todos los paquetes están pagados, marcar el viaje como completado
    IF total_packages > 0 AND paid_packages = total_packages THEN
      UPDATE public.trips
      SET 
        status = 'completed',
        updated_at = NOW()
      WHERE id = trip_id_to_check
        AND status != 'completed'; -- Solo actualizar si no está ya completado
        
      -- Log de la acción automática
      RAISE NOTICE 'Trip % automatically marked as completed - all % packages paid', trip_id_to_check, total_packages;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;