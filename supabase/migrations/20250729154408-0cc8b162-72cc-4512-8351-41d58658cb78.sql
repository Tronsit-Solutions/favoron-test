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
  SELECT COUNT(*) INTO total_packages
  FROM public.packages
  WHERE matched_trip_id = _trip_id
    AND status NOT IN ('rejected', 'cancelled');
  
  SELECT COUNT(*) INTO delivered_packages
  FROM public.packages
  WHERE matched_trip_id = _trip_id 
    AND status = 'delivered_to_office'
    AND office_delivery IS NOT NULL
    AND office_delivery->>'traveler_declaration' IS NOT NULL
    AND office_delivery->>'admin_confirmation' IS NOT NULL;
  
  RETURN (total_packages > 0 AND delivered_packages = total_packages);
END;
$function$