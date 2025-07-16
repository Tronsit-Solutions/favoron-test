-- Add 'rejected' status to packages table constraint
ALTER TABLE public.packages DROP CONSTRAINT packages_status_check;

ALTER TABLE public.packages ADD CONSTRAINT packages_status_check 
CHECK (status IN (
  'pending_approval', 'approved', 'rejected', 'matched', 'quote_sent', 'quote_accepted', 
  'quote_rejected', 'payment_confirmed', 'payment_pending', 'in_transit', 
  'received_by_traveler', 'delivered_to_office'
));