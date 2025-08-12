-- Add quote_expired status to the package status enum if needed
-- and create functions to handle automatic quote expiration

-- First, let's add the quote_expired status (if it doesn't exist)
DO $$ 
BEGIN
    -- This will add the status if it doesn't already exist
    INSERT INTO pg_enum (enumtypid, enumlabel, enumsortorder) 
    SELECT 'package_status'::regtype::oid, 'quote_expired', (
        SELECT MAX(enumsortorder) + 1 FROM pg_enum WHERE enumtypid = 'package_status'::regtype::oid
    )
    WHERE NOT EXISTS (
        SELECT 1 FROM pg_enum WHERE enumtypid = 'package_status'::regtype::oid AND enumlabel = 'quote_expired'
    );
EXCEPTION 
    WHEN others THEN 
        -- If package_status enum doesn't exist, we'll handle this gracefully
        RAISE NOTICE 'Could not add quote_expired status to enum: %', SQLERRM;
END $$;

-- Create function to expire quotes automatically
CREATE OR REPLACE FUNCTION public.expire_old_quotes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  expired_count INTEGER := 0;
  package_record RECORD;
BEGIN
  -- Find and update expired quotes
  FOR package_record IN 
    SELECT id, user_id, item_description, matched_trip_id
    FROM public.packages 
    WHERE status = 'quote_sent' 
      AND quote_expires_at IS NOT NULL 
      AND quote_expires_at < NOW()
  LOOP
    -- Update package status to quote_expired
    UPDATE public.packages 
    SET 
      status = 'quote_expired',
      updated_at = NOW()
    WHERE id = package_record.id;
    
    expired_count := expired_count + 1;
    
    -- Notify shopper about expiration
    PERFORM public.create_notification(
      package_record.user_id,
      '⏰ Cotización expirada',
      CONCAT('La cotización para "', package_record.item_description, '" ha expirado. Puedes solicitar una nueva cotización al viajero.'),
      'quote',
      'normal',
      NULL,
      jsonb_build_object(
        'package_id', package_record.id,
        'expiration_type', 'quote_expired'
      )
    );
    
    -- Notify traveler about expiration (if there's a matched trip)
    IF package_record.matched_trip_id IS NOT NULL THEN
      PERFORM public.create_notification(
        (SELECT user_id FROM public.trips WHERE id = package_record.matched_trip_id),
        '⏰ Tu cotización expiró',
        CONCAT('Tu cotización para "', package_record.item_description, '" ha expirado. El shopper puede solicitar una nueva cotización.'),
        'quote',
        'normal',
        NULL,
        jsonb_build_object(
          'package_id', package_record.id,
          'trip_id', package_record.matched_trip_id,
          'expiration_type', 'quote_expired'
        )
      );
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Expired % quotes and sent notifications', expired_count;
END;
$function$;

-- Create trigger function to handle quote expiration on status changes
CREATE OR REPLACE FUNCTION public.handle_quote_expiration_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- If quote expires during an update operation, auto-expire it
  IF NEW.status = 'quote_sent' 
     AND NEW.quote_expires_at IS NOT NULL 
     AND NEW.quote_expires_at < NOW() 
     AND (OLD.status != 'quote_expired' OR OLD.status IS NULL) THEN
    
    NEW.status = 'quote_expired';
    
    -- Log that we auto-expired this quote
    RAISE NOTICE 'Auto-expired quote for package % due to expiration date', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_handle_quote_expiration ON public.packages;
CREATE TRIGGER trigger_handle_quote_expiration
  BEFORE UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_quote_expiration_on_update();

-- Allow transition from quote_expired back to quote_sent (for new quotes)
COMMENT ON FUNCTION public.expire_old_quotes() IS 'Function to automatically expire quotes and notify users';
COMMENT ON FUNCTION public.handle_quote_expiration_on_update() IS 'Trigger function to auto-expire quotes during updates';