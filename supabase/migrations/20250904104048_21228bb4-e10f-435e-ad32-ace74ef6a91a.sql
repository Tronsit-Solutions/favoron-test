-- Update expire_old_quotes to unlink traveler info on quote expiration
CREATE OR REPLACE FUNCTION public.expire_old_quotes()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  expired_count INTEGER := 0;
  package_record RECORD;
  prev_trip_id uuid;
BEGIN
  -- Find and update expired quotes
  FOR package_record IN 
    SELECT id, user_id, item_description, matched_trip_id
    FROM public.packages 
    WHERE status = 'quote_sent' 
      AND quote_expires_at IS NOT NULL 
      AND quote_expires_at < NOW()
  LOOP
    prev_trip_id := package_record.matched_trip_id;

    -- Update package status to quote_expired and unlink traveler
    UPDATE public.packages 
    SET 
      status = 'quote_expired',
      matched_trip_id = NULL,
      traveler_address = NULL,
      matched_trip_dates = NULL,
      updated_at = NOW()
    WHERE id = package_record.id;
    
    expired_count := expired_count + 1;
    
    -- Log admin/system action
    PERFORM public.log_admin_action(
      package_record.id,
      NULL, -- system action
      'quote_expired',
      'System auto-unlinked traveler due to quote expiration',
      jsonb_build_object(
        'previous_trip_id', prev_trip_id,
        'reason', 'quote_not_paid_expired'
      )
    );
    
    -- Notify shopper about expiration and release
    PERFORM public.create_notification(
      package_record.user_id,
      '⏰ Cotización expirada',
      CONCAT('La cotización para "', package_record.item_description, '" ha expirado. Tu solicitud ha sido liberada para reasignación.'),
      'quote',
      'normal',
      NULL,
      jsonb_build_object(
        'package_id', package_record.id,
        'expiration_type', 'quote_expired',
        'unlinked', true
      )
    );
    
    -- Notify traveler about expiration if there was a matched trip
    IF prev_trip_id IS NOT NULL THEN
      PERFORM public.create_notification(
        (SELECT user_id FROM public.trips WHERE id = prev_trip_id),
        '⏰ Tu cotización expiró',
        CONCAT('Tu cotización para "', package_record.item_description, '" ha expirado y el paquete fue liberado.'),
        'quote',
        'normal',
        NULL,
        jsonb_build_object(
          'package_id', package_record.id,
          'trip_id', prev_trip_id,
          'expiration_type', 'quote_expired',
          'unlinked', true
        )
      );
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Expired % quotes, unlinked travelers and sent notifications', expired_count;
END;
$function$;