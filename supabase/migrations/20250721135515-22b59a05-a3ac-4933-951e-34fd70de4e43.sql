-- Actualizar el constraint para incluir el nuevo status pending_office_confirmation
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_status_check;

ALTER TABLE packages ADD CONSTRAINT packages_status_check 
CHECK (status = ANY (ARRAY[
  'pending_approval'::text, 
  'approved'::text, 
  'rejected'::text, 
  'matched'::text, 
  'quote_sent'::text, 
  'quote_accepted'::text, 
  'quote_rejected'::text, 
  'payment_confirmed'::text, 
  'payment_pending'::text, 
  'paid'::text,
  'in_transit'::text, 
  'received_by_traveler'::text, 
  'pending_office_confirmation'::text,
  'delivered_to_office'::text,
  'out_for_delivery'::text,
  'completed'::text
]));