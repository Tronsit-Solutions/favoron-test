-- Actualizar el check constraint para incluir todos los estados existentes y los nuevos
ALTER TABLE public.packages 
DROP CONSTRAINT IF EXISTS packages_status_check;

ALTER TABLE public.packages 
ADD CONSTRAINT packages_status_check 
CHECK (status IN (
  'pending_approval',
  'approved', 
  'matched',
  'quote_sent',
  'quote_accepted',
  'quote_rejected',
  'payment_pending',
  'payment_pending_approval', 
  'payment_confirmed',
  'pending_purchase',
  'purchase_confirmed',
  'in_transit',
  'pending_office_confirmation',
  'ready_for_pickup',
  'ready_for_delivery', 
  'delivered_to_office',
  'received_by_traveler',
  'completed',
  'cancelled',
  'rejected'
));