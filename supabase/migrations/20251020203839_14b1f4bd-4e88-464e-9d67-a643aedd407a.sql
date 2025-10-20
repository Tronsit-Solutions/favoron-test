-- Fix: Make auto_approve_prime_payments more robust and execute AFTER other triggers
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
      -- FORCE status change even if other triggers modified it
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
      
      RAISE NOTICE '✅ Auto-approved payment for % user % (package %) - Status FORCED to: pending_purchase', 
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

-- Drop old trigger and recreate with even later execution order
DROP TRIGGER IF EXISTS zzz_auto_approve_prime_payments_trigger ON public.packages;
DROP TRIGGER IF EXISTS auto_approve_prime_payments_trigger ON public.packages;

-- Use 'zzzz' prefix to ensure it runs ABSOLUTELY LAST
CREATE TRIGGER zzzz_auto_approve_prime_payments_trigger
  BEFORE UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_prime_payments();

-- Alternative: Use AFTER UPDATE trigger to forcefully correct status as fallback
CREATE OR REPLACE FUNCTION public.auto_approve_prime_payments_after()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_trust_level TEXT;
BEGIN
  -- Only process if payment receipt was just uploaded and auto_approved flag exists
  IF NEW.payment_receipt IS NOT NULL 
     AND (NEW.payment_receipt->>'auto_approved')::boolean = true
     AND NEW.status = 'payment_pending_approval' THEN
    
    -- Get user trust_level
    SELECT trust_level::text INTO user_trust_level
    FROM profiles
    WHERE id = NEW.user_id;
    
    -- If user is prime/confiable but status is wrong, fix it
    IF user_trust_level IN ('prime', 'confiable') THEN
      UPDATE packages
      SET status = 'pending_purchase'
      WHERE id = NEW.id;
      
      RAISE NOTICE '🔧 AFTER trigger fixed status for package % from payment_pending_approval to pending_purchase', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zzzz_auto_approve_prime_payments_after_trigger ON public.packages;

CREATE TRIGGER zzzz_auto_approve_prime_payments_after_trigger
  AFTER UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_prime_payments_after();

-- Fix existing packages: Susan's package and any other Prime/Confiable users stuck in payment_pending_approval
UPDATE packages p
SET 
  status = 'pending_purchase',
  updated_at = NOW()
FROM profiles pr
WHERE p.user_id = pr.id
  AND pr.trust_level IN ('prime', 'confiable')
  AND p.status = 'payment_pending_approval'
  AND p.payment_receipt IS NOT NULL
  AND (p.payment_receipt->>'auto_approved')::boolean = true;

-- Log affected packages
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected_count
  FROM packages p
  JOIN profiles pr ON p.user_id = pr.id
  WHERE pr.trust_level IN ('prime', 'confiable')
    AND p.status = 'pending_purchase'
    AND p.payment_receipt IS NOT NULL
    AND (p.payment_receipt->>'auto_approved')::boolean = true;
    
  RAISE NOTICE '✅ Fixed % packages that were stuck in payment_pending_approval', affected_count;
END $$;