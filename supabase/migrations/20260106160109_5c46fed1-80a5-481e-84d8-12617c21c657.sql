-- Fix auto_approve_prime_payments trigger to respect card payments from Recurrente
CREATE OR REPLACE FUNCTION auto_approve_prime_payments()
RETURNS TRIGGER AS $$
DECLARE
  user_trust_level TEXT;
  incoming_auto_approved BOOLEAN;
BEGIN
  -- Only process when a new payment receipt is uploaded
  IF NEW.payment_receipt IS NOT NULL 
     AND (OLD.payment_receipt IS NULL OR OLD.payment_receipt IS DISTINCT FROM NEW.payment_receipt) THEN
    
    -- Check if the incoming payment is already marked as auto_approved (card payment from Recurrente)
    incoming_auto_approved := COALESCE((NEW.payment_receipt->>'auto_approved')::boolean, false);
    
    -- If payment is already auto-approved (from Recurrente webhook), preserve it
    IF incoming_auto_approved = true THEN
      -- Ensure status is set to pending_purchase for card payments
      IF NEW.status NOT IN ('in_transit', 'received_by_traveler', 'pending_office_confirmation', 
                            'delivered_to_office', 'out_for_delivery', 'completed', 'cancelled') THEN
        NEW.status := 'pending_purchase';
      END IF;
      RETURN NEW;
    END IF;
    
    -- Get user trust_level from profiles (only for manual payments)
    SELECT trust_level::text INTO user_trust_level
    FROM profiles
    WHERE id = NEW.user_id;
    
    -- CRITICAL FIX: Only change status if package is NOT in an advanced state
    IF OLD.status NOT IN ('in_transit', 'received_by_traveler', 'pending_office_confirmation', 
                          'delivered_to_office', 'out_for_delivery', 'completed', 'cancelled') THEN
      
      -- Auto-approve if user is 'prime' or 'confiable'
      IF user_trust_level IN ('prime', 'confiable') THEN
        NEW.status := 'pending_purchase';
        NEW.payment_receipt := jsonb_set(
          jsonb_set(
            NEW.payment_receipt,
            '{auto_approved}',
            'true'::jsonb
          ),
          '{trust_level_at_upload}',
          to_jsonb(user_trust_level)
        );
      ELSE
        NEW.status := 'payment_pending_approval';
        NEW.payment_receipt := jsonb_set(
          jsonb_set(
            NEW.payment_receipt,
            '{auto_approved}',
            'false'::jsonb
          ),
          '{trust_level_at_upload}',
          to_jsonb(user_trust_level)
        );
      END IF;
      
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the existing package that was incorrectly set to payment_pending_approval
UPDATE packages 
SET 
  status = 'pending_purchase',
  payment_receipt = jsonb_set(payment_receipt, '{auto_approved}', 'true'::jsonb)
WHERE id = '9f02f06d-8b45-41e6-bcf8-1c210a31d9ec'
  AND status = 'payment_pending_approval';