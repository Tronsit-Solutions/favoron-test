-- Remove traveler notification from expire_old_quotes
-- When a quote expires, the package silently disappears from traveler's list
CREATE OR REPLACE FUNCTION public.expire_old_quotes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  package_record RECORD;
BEGIN
  FOR package_record IN
    SELECT p.id, p.user_id, p.matched_trip_id, p.item_description
    FROM public.packages p
    WHERE p.status IN ('quote_sent', 'payment_pending')
      AND p.quote_expires_at IS NOT NULL
      AND p.quote_expires_at < NOW()
  LOOP
    -- Update package status and clear trip assignment
    UPDATE public.packages
    SET 
      status = 'quote_expired',
      matched_trip_id = NULL,
      traveler_address = NULL,
      matched_trip_dates = NULL,
      updated_at = NOW()
    WHERE id = package_record.id;

    -- Traveler notification REMOVED (package silently disappears from their list)
    -- Shopper notification already removed previously

    RAISE NOTICE 'Expired quote for package %', package_record.id;
  END LOOP;
END;
$$;