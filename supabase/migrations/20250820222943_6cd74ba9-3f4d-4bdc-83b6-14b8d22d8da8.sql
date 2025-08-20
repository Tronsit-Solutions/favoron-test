-- Fix triggers that blocked admin confirmation by avoiding invalid trip status updates
-- 1) Make update_trip_status_on_package_update a no-op for trip.status (do not set 'completed')
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
  -- Identify trip affected by the package change
  trip_id := COALESCE(NEW.matched_trip_id, OLD.matched_trip_id);
  IF trip_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Optional check kept for observability; no status mutation here
  BEGIN
    SELECT public.are_all_trip_packages_delivered(trip_id) INTO should_complete;
  EXCEPTION WHEN undefined_function THEN
    -- Helper might not exist in some environments; ignore
    should_complete := false;
  END;

  -- IMPORTANT: Do not update trips.status here.
  -- Trip completion is handled explicitly during the payment process.
  RETURN NEW;
END;
$function$;

-- 2) Update complete_past_trips_without_packages to use a valid status
CREATE OR REPLACE FUNCTION public.complete_past_trips_without_packages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Mark trips with no effective packages as completed_paid after arrival
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

-- 3) Ensure the accumulator trigger is present (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_trip_payment_accumulator_trigger'
  ) THEN
    EXECUTE $$
      CREATE TRIGGER update_trip_payment_accumulator_trigger
      AFTER UPDATE ON public.packages
      FOR EACH ROW
      EXECUTE FUNCTION public.update_trip_payment_accumulator();
    $$;
  END IF;
END $$;
