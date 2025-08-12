
-- 1) Reemplazar helper: todos los paquetes entregados y confirmados por admin (sin depender del status)
CREATE OR REPLACE FUNCTION public.check_all_packages_delivered(_trip_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_packages INTEGER;
  delivered_packages INTEGER;
BEGIN
  -- Total de paquetes relevantes (excluye rechazados/cancelados)
  SELECT COUNT(*) INTO total_packages
  FROM public.packages
  WHERE matched_trip_id = _trip_id
    AND status NOT IN ('rejected', 'cancelled');

  IF total_packages = 0 THEN
    RETURN FALSE;
  END IF;

  -- Paquetes con entrega en oficina confirmada por viajero y admin
  SELECT COUNT(*) INTO delivered_packages
  FROM public.packages
  WHERE matched_trip_id = _trip_id
    AND status NOT IN ('rejected', 'cancelled')
    AND office_delivery IS NOT NULL
    AND office_delivery->>'traveler_declaration' IS NOT NULL
    AND office_delivery->>'admin_confirmation' IS NOT NULL;

  RETURN delivered_packages = total_packages;
END;
$function$;

-- 2) Función de trigger: completar viaje cuando todos sus paquetes estén confirmados
CREATE OR REPLACE FUNCTION public.update_trip_status_on_package_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  trip_id uuid;
  should_complete boolean;
BEGIN
  -- Resolver el trip impactado (insert/update puede cambiar matched_trip_id)
  trip_id := COALESCE(NEW.matched_trip_id, OLD.matched_trip_id);

  IF trip_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Ignorar viajes ya completados/cancelados
  IF EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.id = trip_id
      AND t.status IN ('completed', 'cancelled')
  ) THEN
    RETURN NEW;
  END IF;

  -- Completar el viaje si todos sus paquetes están confirmados en oficina
  should_complete := public.check_all_packages_delivered(trip_id);

  IF should_complete THEN
    UPDATE public.trips
    SET status = 'completed',
        updated_at = NOW()
    WHERE id = trip_id
      AND status <> 'completed';
  END IF;

  RETURN NEW;
END;
$function$;

-- 3) Trigger sobre packages para disparar la verificación
DROP TRIGGER IF EXISTS trg_update_trip_status_on_package_update ON public.packages;
CREATE TRIGGER trg_update_trip_status_on_package_update
AFTER INSERT OR UPDATE OF status, office_delivery, matched_trip_id
ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.update_trip_status_on_package_update();

-- 4) Completar viajes sin paquetes cuando ya pasó la fecha de llegada
CREATE OR REPLACE FUNCTION public.complete_past_trips_without_packages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.trips t
  SET status = 'completed',
      updated_at = NOW()
  WHERE t.status IN ('approved', 'active')
    AND t.arrival_date < NOW()
    AND NOT EXISTS (
      SELECT 1
      FROM public.packages p
      WHERE p.matched_trip_id = t.id
        AND p.status NOT IN ('rejected', 'cancelled')
    );
END;
$function$;

-- 5) Índice de soporte para consultas por matched_trip_id
CREATE INDEX IF NOT EXISTS idx_packages_matched_trip_id ON public.packages (matched_trip_id);
