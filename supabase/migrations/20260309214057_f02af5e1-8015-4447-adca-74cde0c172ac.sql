-- Update CHECK constraint to include 'expired' and 'cancelled'
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_status_check;
ALTER TABLE public.trips ADD CONSTRAINT trips_status_check 
CHECK (status IN (
  'pending_approval', 'approved', 'active', 'completed', 'completed_paid', 'rejected', 'cancelled', 'expired'
));

-- Create function to expire trips without paid packages
CREATE OR REPLACE FUNCTION expire_trips_without_paid_packages()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  WITH trips_to_expire AS (
    SELECT t.id
    FROM trips t
    WHERE t.status = 'approved'
      AND COALESCE(t.last_day_packages, t.arrival_date)::date < CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM packages p
        WHERE p.matched_trip_id = t.id
          AND p.status NOT IN ('cancelled', 'rejected', 'deadline_expired', 'quote_expired', 'pending_approval')
      )
  )
  UPDATE trips SET status = 'expired', updated_at = now()
  WHERE id IN (SELECT id FROM trips_to_expire);
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN jsonb_build_object('expired_count', expired_count);
END;
$$;