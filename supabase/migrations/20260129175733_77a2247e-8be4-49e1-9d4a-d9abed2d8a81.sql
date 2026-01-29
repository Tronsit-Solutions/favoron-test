-- Remove shopper expiration notification from expire_old_quotes
-- This reduces HTTP calls by 50% and prevents timeout issues
-- The shopper already sees "Cotización expirada" status in their dashboard

CREATE OR REPLACE FUNCTION public.expire_old_quotes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  package_record RECORD;
  trip_record RECORD;
BEGIN
  -- Find packages with expired quotes that haven't been paid
  FOR package_record IN
    SELECT p.id, p.user_id, p.matched_trip_id, p.item_description
    FROM public.packages p
    WHERE p.status IN ('quote_sent', 'payment_pending')
      AND p.quote_expires_at IS NOT NULL
      AND p.quote_expires_at < NOW()
  LOOP
    -- Get trip info for traveler notification
    SELECT t.id, t.user_id INTO trip_record
    FROM public.trips t
    WHERE t.id = package_record.matched_trip_id;

    -- Update package status and clear trip assignment
    UPDATE public.packages
    SET 
      status = 'quote_expired',
      matched_trip_id = NULL,
      traveler_address = NULL,
      matched_trip_dates = NULL,
      updated_at = NOW()
    WHERE id = package_record.id;

    -- Create notification for traveler about expired assignment (if there was a matched trip)
    IF trip_record.user_id IS NOT NULL THEN
      BEGIN
        PERFORM public.create_notification(
          trip_record.user_id,
          'Asignación expirada',
          'Un paquete fue removido de tu lista porque el shopper no completó el pago a tiempo.',
          'assignment',
          'normal',
          '/dashboard',
          jsonb_build_object('package_id', package_record.id, 'trip_id', trip_record.id)
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to create traveler notification for package %: %', package_record.id, SQLERRM;
      END;
    END IF;

    -- REMOVED: Shopper notification - they already see "Cotización expirada" in their dashboard
    -- This reduces HTTP calls and prevents timeout issues with stuck packages

    RAISE NOTICE 'Expired quote for package %', package_record.id;
  END LOOP;
END;
$$;