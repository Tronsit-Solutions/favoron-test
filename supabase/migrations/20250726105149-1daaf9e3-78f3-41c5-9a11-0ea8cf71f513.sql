-- Add 'pending_purchase' status to the packages table constraint
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_status_check;

ALTER TABLE packages ADD CONSTRAINT packages_status_check 
CHECK (status IN (
  'pending_approval',
  'approved', 
  'matched',
  'quote_sent',
  'quote_accepted',
  'quote_rejected',
  'payment_pending_approval',
  'payment_confirmed',
  'payment_pending',
  'pending_purchase',
  'in_transit',
  'received_by_traveler',
  'pending_office_confirmation',
  'delivered_to_office',
  'out_for_delivery',
  'completed',
  'rejected'
));