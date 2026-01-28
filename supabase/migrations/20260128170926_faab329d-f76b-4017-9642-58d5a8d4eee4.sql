-- Update expire_old_quotes to auto-clean traveler fields and log history
CREATE OR REPLACE FUNCTION public.expire_old_quotes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  package_record RECORD;
  prev_trip_id UUID;
  traveler_user_id UUID;
BEGIN
  FOR package_record IN 
    SELECT p.id, p.user_id, p.item_description, p.matched_trip_id, p.status,
           t.user_id as trip_user_id
    FROM public.packages p
    LEFT JOIN public.trips t ON t.id = p.matched_trip_id
    WHERE (p.status = 'quote_sent' OR p.status = 'payment_pending')
      AND p.quote_expires_at IS NOT NULL 
      AND p.quote_expires_at < NOW()
  LOOP
    -- Capture previous trip info before clearing
    prev_trip_id := package_record.matched_trip_id;
    traveler_user_id := package_record.trip_user_id;

    -- Update package: status expired + auto-clean traveler fields
    UPDATE public.packages 
    SET 
      status = 'quote_expired',
      quote = NULL,
      matched_trip_id = NULL,           -- Auto-clean so it doesn't appear in traveler dashboard
      traveler_address = NULL,
      matched_trip_dates = NULL,
      quote_expires_at = NULL,
      matched_assignment_expires_at = NULL,
      admin_assigned_tip = NULL,
      updated_at = NOW()
      -- NOTE: We do NOT touch traveler_dismissed_at (will be deprecated)
    WHERE id = package_record.id;
    
    -- Log historical assignment info for audit trail
    PERFORM public.log_admin_action(
      package_record.id,
      NULL,  -- No admin performing this action (automated)
      'quote_expired_auto_cleanup',
      'Quote expired - traveler fields auto-cleaned',
      jsonb_build_object(
        'previous_trip_id', prev_trip_id,
        'previous_traveler_id', traveler_user_id,
        'previous_status', package_record.status,
        'reason', 'shopper_did_not_pay',
        'automated', true
      )
    );
    
    -- Create notification for shopper about expired quote
    BEGIN
      PERFORM public.create_notification(
        package_record.user_id,
        'Cotización expirada',
        'Tu cotización ha expirado porque no se completó el pago a tiempo.',
        'quote',
        'normal',
        '/dashboard',
        jsonb_build_object('package_id', package_record.id)
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create shopper notification for package %: %', package_record.id, SQLERRM;
    END;
    
    -- Create notification for traveler about expired assignment
    IF traveler_user_id IS NOT NULL THEN
      BEGIN
        PERFORM public.create_notification(
          traveler_user_id,
          'Asignación expirada',
          'La cotización del paquete asignado expiró. El paquete fue removido de tu lista.',
          'package',
          'normal',
          '/dashboard',
          jsonb_build_object('package_id', package_record.id, 'previous_trip_id', prev_trip_id)
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to create traveler notification for package %: %', package_record.id, SQLERRM;
      END;
    END IF;
    
  END LOOP;
END;
$function$;