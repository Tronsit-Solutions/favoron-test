-- One-time cleanup: cancel stale assignments for packages no longer in active matching
-- This is a data fix, not a schema change, but needed via migration since no other UPDATE path exists
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE public.package_assignments
  SET status = 'bid_cancelled', updated_at = NOW()
  WHERE status IN ('bid_submitted', 'bid_pending', 'bid_won')
    AND package_id IN (
      SELECT id FROM public.packages
      WHERE status IN ('quote_expired', 'approved', 'quote_rejected')
        AND matched_trip_id IS NULL
    );
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Cancelled % stale assignments', affected_count;
END;
$$;