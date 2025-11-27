-- Fix auto_approve_prime_payments trigger to prevent reverting advanced statuses
CREATE OR REPLACE FUNCTION public.auto_approve_prime_payments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_trust_level TEXT;
BEGIN
  -- Log trigger execution
  RAISE NOTICE '🔍 auto_approve_prime_payments triggered for package % by user %', NEW.id, NEW.user_id;
  
  -- Only process when a new payment receipt is uploaded
  IF NEW.payment_receipt IS NOT NULL 
     AND (OLD.payment_receipt IS NULL OR OLD.payment_receipt IS DISTINCT FROM NEW.payment_receipt) THEN
    
    RAISE NOTICE '📎 Payment receipt detected, checking trust level...';
    
    -- Get user trust_level from profiles
    SELECT trust_level::text INTO user_trust_level
    FROM profiles
    WHERE id = NEW.user_id;
    
    RAISE NOTICE '👤 User trust level: %', user_trust_level;
    
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
        
        RAISE NOTICE '✅ Auto-approved payment for % user % (package %) - Status set to: pending_purchase', 
          user_trust_level, NEW.user_id, NEW.id;
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
        
        RAISE NOTICE '⏳ Payment pending approval for basic user % (package %) - Status set to: payment_pending_approval', 
          NEW.user_id, NEW.id;
      END IF;
      
    ELSE
      -- Package is in advanced state, preserve the status
      RAISE NOTICE '⚠️ Package % is in advanced state (%), not changing status', NEW.id, OLD.status;
    END IF;
    
  ELSE
    RAISE NOTICE '⏭️ Skipping auto-approve logic (no new payment receipt)';
  END IF;
  
  RETURN NEW;
END;
$function$;