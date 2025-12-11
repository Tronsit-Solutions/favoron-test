-- Eliminar el constraint antiguo
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_status_check;

-- Crear el nuevo constraint con los estados de preparación y última milla incluidos
ALTER TABLE packages ADD CONSTRAINT packages_status_check CHECK (
  status = ANY (ARRAY[
    'pending_approval'::text, 'approved'::text, 'rejected'::text, 
    'matched'::text, 'quote_sent'::text, 'quote_rejected'::text, 
    'quote_expired'::text, 'quote_accepted'::text, 'payment_pending'::text,
    'payment_pending_approval'::text, 'payment_confirmed'::text, 
    'paid'::text, 'pending_purchase'::text, 'purchased'::text, 
    'shipped'::text, 'in_transit'::text, 'received_by_traveler'::text,
    'pending_office_confirmation'::text, 'delivered_to_office'::text,
    'ready_for_pickup'::text, 'ready_for_delivery'::text,
    'out_for_delivery'::text,
    'delivered'::text, 'completed'::text, 'cancelled'::text, 
    'address_confirmed'::text, 'archived_by_shopper'::text
  ])
);