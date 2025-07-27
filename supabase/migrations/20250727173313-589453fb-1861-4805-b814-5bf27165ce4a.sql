-- Fix security warning by setting search_path in the function
CREATE OR REPLACE FUNCTION public.set_quote_expiration()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If quote is being set and quote_expires_at is null, set it to 24 hours from now
  IF NEW.quote IS NOT NULL 
     AND (OLD.quote IS NULL OR OLD.quote != NEW.quote)
     AND NEW.quote_expires_at IS NULL THEN
    NEW.quote_expires_at = NOW() + INTERVAL '24 hours';
  END IF;
  
  -- If quote is being removed, clear expiration
  IF NEW.quote IS NULL AND OLD.quote IS NOT NULL THEN
    NEW.quote_expires_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;