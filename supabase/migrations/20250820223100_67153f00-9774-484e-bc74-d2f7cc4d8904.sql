-- Fix triggers blocking admin confirmation by avoiding invalid trip status updates

-- 1) Make update_trip_status_on_package_update a no-op for trip.status
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
  trip_id := COALESCE(NEW.matched_trip_id, OLD.matched_trip_id);
  IF trip_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Keep check for observability; do not mutate trips.status here
  BEGIN
    SELECT public.are_all_trip_packages_delivered(trip_id) INTO should_complete;
  EXCEPTION WHEN undefined_function THEN
    should_complete := false;
  END;

  RETURN NEW;
END;
$function$;

-- 2) Use a valid status in auto-completion job for trips without packages
CREATE OR REPLACE FUNCTION public.complete_past_trips_without_packages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.trips t
  SET status = 'completed_paid',
      updated_at = NOW()
  WHERE t.arrival_date < NOW()
    AND t.status IN ('approved', 'active')
    AND NOT EXISTS (
      SELECT 1 FROM public.packages p
      WHERE p.matched_trip_id = t.id
        AND p.status NOT IN ('cancelled','rejected')
    );
END;
$function$;

-- 3) Recreate accumulator trigger deterministically
DROP TRIGGER IF EXISTS update_trip_payment_accumulator_trigger ON public.packages;
CREATE TRIGGER update_trip_payment_accumulator_trigger
AFTER UPDATE ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.update_trip_payment_accumulator();
