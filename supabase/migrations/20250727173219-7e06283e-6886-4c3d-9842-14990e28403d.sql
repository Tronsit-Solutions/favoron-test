-- Add quote expiration field to packages table
ALTER TABLE public.packages 
ADD COLUMN quote_expires_at TIMESTAMP WITH TIME ZONE NULL;

-- Create function to set quote expiration when quote is created/updated
CREATE OR REPLACE FUNCTION public.set_quote_expiration()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set quote expiration
CREATE TRIGGER trigger_set_quote_expiration
  BEFORE UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_quote_expiration();