-- First, let's check what constraint exists on status
SELECT 
    tc.constraint_name, 
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'packages' AND tc.constraint_type = 'CHECK';

-- Drop the existing constraint and add quote_expired to allowed values
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_status_check;

-- Add new constraint with quote_expired included
ALTER TABLE packages ADD CONSTRAINT packages_status_check 
CHECK (status IN (
    'pending_approval',
    'approved', 
    'matched',
    'quote_sent',
    'quote_expired',
    'quote_accepted',
    'awaiting_payment',
    'payment_pending_approval',
    'paid',
    'pending_purchase',
    'purchased',
    'in_transit',
    'pending_office_confirmation',
    'delivered_to_office',
    'ready_for_pickup',
    'ready_for_delivery',
    'completed',
    'cancelled',
    'rejected'
));

-- Now run the expire function
SELECT expire_old_quotes() as expired_count;