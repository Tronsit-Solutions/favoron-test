
-- 1) Función: auto-archivar cuando rejection_reason = 'no_longer_want'
CREATE OR REPLACE FUNCTION public.auto_archive_by_shopper_on_rejection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $func$
BEGIN
  IF NEW.rejection_reason = 'no_longer_want' THEN
    -- Mover a historial y limpiar vínculos sensibles
    NEW.status := 'archived_by_shopper';
    NEW.wants_requote := false;
    NEW.matched_trip_id := NULL;
    NEW.quote := NULL;
    NEW.quote_expires_at := NULL;
    NEW.matched_trip_dates := NULL;
    NEW.traveler_address := NULL;
  END IF;

  RETURN NEW;
END;
$func$;

-- 2) Trigger para INSERT/UPDATE de rejection_reason o status
DROP TRIGGER IF EXISTS trg_auto_archive_by_shopper ON public.packages;

CREATE TRIGGER trg_auto_archive_by_shopper
BEFORE INSERT OR UPDATE OF rejection_reason, status
ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.auto_archive_by_shopper_on_rejection();

-- 3) Backfill de datos existentes: mover todo lo que tenga 'no_longer_want' a archived_by_shopper
UPDATE public.packages
SET 
  status = 'archived_by_shopper',
  wants_requote = false,
  matched_trip_id = NULL,
  quote = NULL,
  quote_expires_at = NULL,
  matched_trip_dates = NULL,
  traveler_address = NULL,
  updated_at = NOW()
WHERE rejection_reason = 'no_longer_want'
  AND status <> 'archived_by_shopper';
