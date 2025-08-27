-- Allow archiving packages by expanding the allowed status values
-- Drop existing CHECK constraint and recreate with the new set including 'archived_by_shopper'

ALTER TABLE public.packages
  DROP CONSTRAINT IF EXISTS packages_status_check;

ALTER TABLE public.packages
  ADD CONSTRAINT packages_status_check
  CHECK (
    status IN (
      'pending_approval',
      'approved',
      'matched',
      'quote_sent',
      'quote_accepted',
      'quote_rejected',
      'quote_expired',
      'payment_pending',
      'payment_pending_approval',
      'payment_confirmed',
      'paid',
      'pending_purchase',
      'purchased',
      'shipped',
      'in_transit',
      'received_by_traveler',
      'delivered',
      'pending_office_confirmation',
      'delivered_to_office',
      'cancelled',
      'rejected',
      'archived_by_shopper',
      'completed'
    )
  );