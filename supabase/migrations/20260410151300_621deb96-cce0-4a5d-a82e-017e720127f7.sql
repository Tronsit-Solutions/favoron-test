
-- 1. Optimize assign_package_to_travelers: avoid writing products_data/admin_assigned_tip when unchanged
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
  --    Only write products_data and admin_assigned_tip when they actually differ
  --    to avoid firing column-sensitive triggers unnecessarily
  UPDATE packages SET
    status = 'matched',
    admin_assigned_tip = CASE
      WHEN _admin_tip IS DISTINCT FROM packages.admin_assigned_tip THEN _admin_tip
      ELSE packages.admin_assigned_tip END,
    traveler_dismissal = NULL,
    traveler_dismissed_at = NULL,
    products_data = CASE
      WHEN _products_data IS NOT NULL AND _products_data IS DISTINCT FROM packages.products_data
      THEN _products_data
      ELSE packages.products_data END,
    updated_at = now()
  WHERE id = _package_id;

  -- 4. Return summary
  RETURN jsonb_build_object(
    'assigned_trip_ids', to_jsonb(_new_trip_ids),
    'skipped_count', array_length(_trip_ids, 1) - COALESCE(array_length(_new_trip_ids, 1), 0)
  );
END;
$$;

-- 2. Add early return to preserve_product_item_links when products_data hasn't changed
CREATE OR REPLACE FUNCTION public.preserve_product_item_links()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Early return: skip expensive jsonb_agg when products_data hasn't changed
  IF TG_OP = 'UPDATE' AND NEW.products_data IS NOT DISTINCT FROM OLD.products_data THEN
    RETURN NEW;
  END IF;

  -- Solo actuar si products_data existe y es un array
  IF NEW.products_data IS NOT NULL 
     AND jsonb_typeof(NEW.products_data) = 'array' 
     AND jsonb_array_length(NEW.products_data) > 0 THEN
    
    -- Para cada producto en el array, asegurar que itemLink esté presente
    NEW.products_data := (
      SELECT jsonb_agg(
        CASE 
          WHEN elem->>'itemLink' IS NOT NULL AND elem->>'itemLink' != '' THEN 
            elem
          WHEN NEW.item_link IS NOT NULL AND NEW.item_link != '' THEN
            jsonb_set(elem, '{itemLink}', to_jsonb(NEW.item_link))
          WHEN TG_OP = 'UPDATE' AND OLD.products_data IS NOT NULL THEN
            CASE
              WHEN (SELECT (old_elem->>'itemLink') 
                    FROM jsonb_array_elements(OLD.products_data) WITH ORDINALITY AS t(old_elem, idx) 
                    WHERE idx = elem_idx) IS NOT NULL
              THEN jsonb_set(elem, '{itemLink}', 
                   to_jsonb((SELECT (old_elem->>'itemLink') 
                             FROM jsonb_array_elements(OLD.products_data) WITH ORDINALITY AS t(old_elem, idx) 
                             WHERE idx = elem_idx)))
              ELSE elem
            END
          ELSE elem
        END
      )
      FROM jsonb_array_elements(NEW.products_data) WITH ORDINALITY AS t(elem, elem_idx)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Replace update_trip_status_on_package_update: remove non-existent function call + exception block
CREATE OR REPLACE FUNCTION public.update_trip_status_on_package_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- No-op: trip status completion is managed by other mechanisms
  RETURN NEW;
END;
$$;
