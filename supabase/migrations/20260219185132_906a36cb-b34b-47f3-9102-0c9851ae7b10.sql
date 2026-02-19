
-- First check if constraint exists and drop it to re-add with new status
DO $$
BEGIN
  -- Try to drop existing constraint if it exists
  ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_status_check;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Add constraint with deadline_expired included
ALTER TABLE packages ADD CONSTRAINT packages_status_check CHECK (
  status IN (
    'pending_approval', 'approved', 'matched', 'quote_sent', 'quote_accepted', 
    'quote_rejected', 'quote_expired', 'payment_pending', 'payment_pending_approval',
    'pending_purchase', 'purchase_confirmed', 'in_transit', 'received_by_traveler',
    'pending_office_confirmation', 'delivered_to_office', 'ready_for_pickup', 
    'ready_for_delivery', 'out_for_delivery', 'delivered', 'completed',
    'cancelled', 'rejected', 'archived_by_shopper', 'deadline_expired'
  )
);

-- Create function to expire approved packages with passed deadlines
CREATE OR REPLACE FUNCTION expire_approved_deadlines()
RETURNS jsonb AS $$
DECLARE
  expired_count integer;
BEGIN
  UPDATE packages
  SET status = 'deadline_expired',
      updated_at = now()
  WHERE status = 'approved'
    AND delivery_deadline < now()
    AND wants_requote = false;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN jsonb_build_object('expired_count', expired_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
