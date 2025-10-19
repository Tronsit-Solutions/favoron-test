-- Step 1: Improve the auto_approve_prime_payments function with better logging and simplified conditions
CREATE OR REPLACE FUNCTION public.auto_approve_prime_payments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    RAISE NOTICE '⏭️ Skipping auto-approve logic (no new payment receipt)';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 2: Rename the trigger to ensure it executes LAST (alphabetically after other triggers)
DROP TRIGGER IF EXISTS auto_approve_prime_payments_trigger ON public.packages;

CREATE TRIGGER zzz_auto_approve_prime_payments_trigger
  BEFORE UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_prime_payments();

-- Step 3: Manually correct Katia's package
UPDATE packages
SET 
  status = 'pending_purchase',
  payment_receipt = jsonb_set(
    COALESCE(payment_receipt, '{}'::jsonb),
    '{auto_approved}',
    'true'::jsonb
  ),
  updated_at = NOW()
WHERE id = '1ef2b099-1e6e-4b64-b590-39a74814619f'
  AND user_id = '4601ef02-e28a-400a-9dd5-a9550b58920a'
  AND status = 'payment_pending_approval';