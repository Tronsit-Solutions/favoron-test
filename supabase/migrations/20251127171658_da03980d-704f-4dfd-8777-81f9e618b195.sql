-- Fix ambiguous column reference in discount usage trigger
CREATE OR REPLACE FUNCTION public.register_discount_usage_on_payment_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_discount_code_id UUID;
  v_discount_amount NUMERIC;
BEGIN
  -- Only register usage when payment is approved (status changes to pending_purchase)
  IF NEW.status = 'pending_purchase' 
     AND OLD.status IN ('payment_pending_approval', 'quote_accepted', 'payment_pending')
     AND NEW.quote IS NOT NULL
     AND NEW.quote ? 'discountCodeId' THEN
    
    -- Extract discount information from quote JSONB
    v_discount_code_id := (NEW.quote->>'discountCodeId')::UUID;
    v_discount_amount := (NEW.quote->>'discountAmount')::NUMERIC;
    
    -- Register discount code usage
    INSERT INTO public.discount_code_usage (
      discount_code_id,
      package_id,
      user_id,
      discount_amount,
      used_at
    ) VALUES (
      v_discount_code_id,
      NEW.id,
      NEW.user_id,
      v_discount_amount,
      NOW()
    )
    ON CONFLICT (discount_code_id, package_id) DO NOTHING;
    
    RAISE NOTICE 'Registered discount code usage for package % with code %', NEW.id, v_discount_code_id;
  END IF;
  
  RETURN NEW;
END;
$$;