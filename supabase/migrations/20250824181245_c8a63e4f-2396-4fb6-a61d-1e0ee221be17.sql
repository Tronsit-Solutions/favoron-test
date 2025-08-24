-- Drop and recreate packages status check to allow new statuses
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'packages_status_check' 
      AND conrelid = 'public.packages'::regclass
  ) THEN
    ALTER TABLE public.packages DROP CONSTRAINT packages_status_check;
  END IF;
END $$;

-- Create a comprehensive status check including expired and archival statuses
ALTER TABLE public.packages
  ADD CONSTRAINT packages_status_check
  CHECK (status IN (
    'pending_approval',
    'approved',
    'matched',
    'quote_sent',
    'quote_expired',
    'quote_rejected',
    'pending_purchase',
    'payment_pending_approval',
    'paid',
    'in_transit',
    'received_by_traveler',
    'pending_office_confirmation',
    'delivered_to_office',
    'ready_for_pickup',
    'ready_for_delivery',
    'delivered',
    'completed',
    'rejected',
    'cancelled',
    'assignment_expired',
    'archived_by_shopper'
  ));

-- Re-run quote expiration to update affected packages
SELECT public.expire_old_quotes();