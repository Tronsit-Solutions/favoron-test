-- Add traveler_dismissed_at column to packages table
ALTER TABLE public.packages 
ADD COLUMN IF NOT EXISTS traveler_dismissed_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_packages_traveler_dismissed_at 
ON public.packages (traveler_dismissed_at) 
WHERE traveler_dismissed_at IS NOT NULL;

-- Update expire_old_quotes function to NOT clear matched_trip_id
-- This allows travelers to see expired quotes and dismiss them manually
CREATE OR REPLACE FUNCTION public.expire_old_quotes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  expired_count INTEGER := 0;
  package_record RECORD;
  traveler_id UUID;
  shopper_id UUID;
BEGIN
  -- Find and process expired quotes
  FOR package_record IN 
    SELECT p.id, p.user_id, p.item_description, p.matched_trip_id,
           t.user_id as trip_user_id
    FROM public.packages p
    LEFT JOIN public.trips t ON t.id = p.matched_trip_id
    WHERE p.status = 'quote_sent' 
      AND p.quote_expires_at IS NOT NULL 
      AND p.quote_expires_at < NOW()
  LOOP
    traveler_id := package_record.trip_user_id;
    shopper_id := package_record.user_id;
    
    -- Update status to quote_expired but KEEP matched_trip_id
    -- so traveler can see and dismiss it manually
    UPDATE public.packages 
    SET 
      status = 'quote_expired',
      quote = NULL,
      updated_at = NOW()
      -- NOTE: We intentionally do NOT clear matched_trip_id here
      -- The traveler will dismiss it manually, which will then clear it
    WHERE id = package_record.id;
    
    expired_count := expired_count + 1;
    
    -- Notify traveler about expiration
    IF traveler_id IS NOT NULL THEN
      PERFORM public.create_notification(
        traveler_id,
        '⏰ Cotización expirada',
        CONCAT('La cotización para "', package_record.item_description, '" ha expirado porque el shopper no pagó a tiempo. Puedes descartar este paquete de tu lista.'),
        'package',
        'normal',
        NULL,
        jsonb_build_object(
          'package_id', package_record.id,
          'expiration_type', 'quote_expired',
          'action', 'dismiss_available'
        )
      );
    END IF;
    
    -- Notify shopper about expiration
    IF shopper_id IS NOT NULL THEN
      PERFORM public.create_notification(
        shopper_id,
        '⏰ Cotización expirada',
        CONCAT('La cotización para "', package_record.item_description, '" ha expirado. Puedes solicitar una nueva cotización si aún necesitas el producto.'),
        'package',
        'normal',
        NULL,
        jsonb_build_object(
          'package_id', package_record.id,
          'expiration_type', 'quote_expired'
        )
      );
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Expired % quotes', expired_count;
END;
$function$;

-- Add comment for documentation
COMMENT ON COLUMN public.packages.traveler_dismissed_at IS 'Timestamp when traveler dismissed an expired quote from their view. When set, the package is hidden from their trips list.';