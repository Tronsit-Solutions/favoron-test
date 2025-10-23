-- Fix quote expiration inconsistency: Update from 24 hours to 48 hours
-- This ensures shoppers have 48 hours to accept and pay quotes consistently across the system

-- Update the set_quote_expiration function to use 48 hours instead of 24 hours
CREATE OR REPLACE FUNCTION public.set_quote_expiration()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- If quote is being set and quote_expires_at is null, set it to 48 hours from now
  IF NEW.quote IS NOT NULL 
     AND (OLD.quote IS NULL OR OLD.quote != NEW.quote)
     AND NEW.quote_expires_at IS NULL THEN
    NEW.quote_expires_at = NOW() + INTERVAL '48 hours';
  END IF;
  
  -- If quote is being removed, clear expiration
  IF NEW.quote IS NULL AND OLD.quote IS NOT NULL THEN
    NEW.quote_expires_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add comment to document the change
COMMENT ON FUNCTION public.set_quote_expiration() IS 'Sets quote expiration to 48 hours from creation. Shoppers have 48 hours to accept and pay quotes.';