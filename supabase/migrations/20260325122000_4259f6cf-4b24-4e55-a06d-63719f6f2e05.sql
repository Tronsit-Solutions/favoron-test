CREATE OR REPLACE FUNCTION public.assign_package_to_travelers(
  _package_id UUID,
  _trip_ids UUID[],
  _admin_tip NUMERIC,
  _products_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_trip_ids UUID[];
  _row RECORD;
BEGIN
  -- 1. Filter out trips that already have active assignments
  SELECT array_agg(tid) INTO _new_trip_ids
  FROM unnest(_trip_ids) AS tid
  WHERE tid NOT IN (
    SELECT trip_id FROM package_assignments
    WHERE package_id = _package_id
      AND status IN ('bid_pending', 'bid_submitted', 'bid_won')
  );

  IF _new_trip_ids IS NULL OR array_length(_new_trip_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'NO_NEW_TRIPS: All selected travelers already have active assignments';
  END IF;

  -- 2. Insert assignment rows (building traveler_address & matched_trip_dates server-side)
  FOR _row IN
    SELECT t.id AS trip_id,
           t.package_receiving_address,
           t.first_day_packages,
           t.last_day_packages,
           t.delivery_date,
           t.arrival_date
    FROM trips t
    WHERE t.id = ANY(_new_trip_ids)
  LOOP
    INSERT INTO package_assignments (
      package_id, trip_id, status, admin_assigned_tip,
      traveler_address, matched_trip_dates, products_data
    ) VALUES (
      _package_id,
      _row.trip_id,
      'bid_pending',
      _admin_tip,
      _row.package_receiving_address,
      jsonb_build_object(
        'first_day_packages', _row.first_day_packages,
        'last_day_packages', _row.last_day_packages,
        'delivery_date', _row.delivery_date,
        'arrival_date', _row.arrival_date
      ),
      _products_data
    );
  END LOOP;

  -- 3. Update package to matched status
  UPDATE packages SET
    status = 'matched',
    admin_assigned_tip = _admin_tip,
    traveler_dismissal = NULL,
    traveler_dismissed_at = NULL,
    products_data = COALESCE(_products_data, products_data),
    updated_at = now()
  WHERE id = _package_id;

  -- 4. Return summary
  RETURN jsonb_build_object(
    'assigned_trip_ids', to_jsonb(_new_trip_ids),
    'skipped_count', array_length(_trip_ids, 1) - COALESCE(array_length(_new_trip_ids, 1), 0)
  );
END;
$$;