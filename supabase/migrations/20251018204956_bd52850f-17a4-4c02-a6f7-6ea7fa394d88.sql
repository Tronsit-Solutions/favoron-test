-- Create function to auto-approve Prime user payments
CREATE OR REPLACE FUNCTION public.auto_approve_prime_payments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_trust_level TEXT;
BEGIN
  -- Only process when a new payment receipt is uploaded
  IF NEW.payment_receipt IS NOT NULL 
     AND (OLD.payment_receipt IS NULL OR OLD.payment_receipt IS DISTINCT FROM NEW.payment_receipt) 
     AND NEW.payment_receipt ? 'uploadedAt' THEN
    
    -- Get user trust_level from profiles
    SELECT trust_level::text INTO user_trust_level
    FROM profiles
    WHERE id = NEW.user_id;
    
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
      
      RAISE NOTICE '✅ Auto-approved payment for prime/confiable user % (package %)', NEW.user_id, NEW.id;
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
      
      RAISE NOTICE '⏳ Payment pending approval for basic user % (package %)', NEW.user_id, NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-approve Prime payments
CREATE TRIGGER auto_approve_prime_payments_trigger
  BEFORE UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_prime_payments();

-- Fix existing package that should have been auto-approved
UPDATE packages
SET 
  status = 'pending_purchase',
  payment_receipt = jsonb_set(
    payment_receipt,
    '{auto_approved}',
    'true'::jsonb
  )
WHERE id = '2dc5ec8d-6642-4061-9a1a-8037c3b1a3c4'
  AND status = 'payment_pending_approval'
  AND (payment_receipt->>'trust_level_at_upload' IN ('prime', 'confiable') 
       OR EXISTS (
         SELECT 1 FROM profiles p 
         WHERE p.id = packages.user_id 
         AND p.trust_level::text IN ('prime', 'confiable')
       ));