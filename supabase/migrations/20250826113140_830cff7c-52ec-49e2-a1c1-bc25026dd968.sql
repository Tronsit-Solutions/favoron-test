-- Update packages status check to include payment_pending and related statuses
BEGIN;

-- Drop existing constraint if present
ALTER TABLE public.packages
  DROP CONSTRAINT IF EXISTS packages_status_check;

-- Recreate constraint with the full set of allowed statuses
ALTER TABLE public.packages
  ADD CONSTRAINT packages_status_check CHECK (
    status IN (
      'pending_approval',
      'approved',
      'matched',
      'quote_sent',
      'quote_expired',
      'payment_pending',
      'pending_purchase',
      'paid',
      'in_transit',
      'received_by_traveler',
      'pending_office_confirmation',
      'delivered_to_office',
      'ready_for_pickup',
      'ready_for_delivery',
      'completed',
      'rejected',
      'cancelled',
      'quote_accepted',
      'quote_rejected',
      'out_for_delivery',
      'active',
      'payment_pending_approval',
      'payment_confirmed'
    )
  );

COMMIT;