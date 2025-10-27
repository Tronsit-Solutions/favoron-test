
-- Update validation function to allow shorter account numbers
CREATE OR REPLACE FUNCTION public.validate_payment_order_data()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Validate banking information format
  IF NEW.bank_account_number IS NOT NULL THEN
    -- Remove spaces and validate length
    NEW.bank_account_number := REGEXP_REPLACE(NEW.bank_account_number, '\s+', '', 'g');
    
    -- Changed minimum length from 8 to 4 to allow shorter account numbers
    IF LENGTH(NEW.bank_account_number) < 4 OR LENGTH(NEW.bank_account_number) > 30 THEN
      RAISE EXCEPTION 'Invalid bank account number length';
    END IF;
    
    -- Ensure account number contains only alphanumeric characters and hyphens
    IF NEW.bank_account_number !~ '^[A-Za-z0-9\-]+$' THEN
      RAISE EXCEPTION 'Invalid bank account number format';
    END IF;
  END IF;
  
  -- Validate amount
  IF NEW.amount IS NOT NULL AND NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;
  
  -- Validate bank account holder name
  IF NEW.bank_account_holder IS NOT NULL THEN
    IF LENGTH(TRIM(NEW.bank_account_holder)) < 2 THEN
      RAISE EXCEPTION 'Bank account holder name too short';
    END IF;
    
    -- Remove excessive whitespace
    NEW.bank_account_holder := REGEXP_REPLACE(TRIM(NEW.bank_account_holder), '\s+', ' ', 'g');
  END IF;
  
  RETURN NEW;
END;
$function$;
