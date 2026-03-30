-- 1. One-time cleanup: cancel stale assignments for cancelled/terminal packages
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE public.package_assignments
  SET status = 'bid_cancelled', updated_at = NOW()
  WHERE status IN ('bid_submitted', 'bid_pending', 'bid_won')
    AND package_id IN (
      SELECT id FROM public.packages
      WHERE status IN ('cancelled', 'rejected', 'deadline_expired', 'quote_expired', 'quote_rejected')
        AND matched_trip_id IS NULL
    );
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Cancelled % stale assignments for terminal packages', affected_count;
END;
$$;

-- 2. Trigger: auto-cancel active assignments when a package reaches a terminal state
CREATE OR REPLACE FUNCTION public.cancel_assignments_on_package_terminal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when status changes to a terminal state
  IF NEW.status IN ('cancelled', 'rejected', 'deadline_expired', 'quote_expired', 'quote_rejected')
     AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    UPDATE public.package_assignments
    SET status = 'bid_cancelled', updated_at = NOW()
    WHERE package_id = NEW.id
      AND status IN ('bid_pending', 'bid_submitted', 'bid_won');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cancel_assignments_on_package_terminal ON public.packages;
CREATE TRIGGER trg_cancel_assignments_on_package_terminal
  AFTER UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.cancel_assignments_on_package_terminal();