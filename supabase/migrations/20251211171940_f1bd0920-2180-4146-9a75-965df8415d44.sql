-- Optimized RPC for Operations Panel - fetches all data in one call
CREATE OR REPLACE FUNCTION get_all_operations_data()
RETURNS TABLE (
  id UUID,
  item_description TEXT,
  status TEXT,
  matched_trip_id UUID,
  user_id UUID,
  label_number INT,
  estimated_price NUMERIC,
  delivery_method TEXT,
  created_at TIMESTAMPTZ,
  purchase_origin TEXT,
  package_destination TEXT,
  products_summary JSONB,
  confirmed_delivery_address JSONB,
  -- Trip data joined
  trip_from_city TEXT,
  trip_to_city TEXT,
  trip_arrival_date TIMESTAMPTZ,
  trip_delivery_date TIMESTAMPTZ,
  trip_status TEXT,
  trip_user_id UUID,
  -- Shopper profile
  shopper_first_name TEXT,
  shopper_last_name TEXT,
  -- Traveler profile
  traveler_first_name TEXT,
  traveler_last_name TEXT,
  traveler_phone TEXT,
  traveler_country_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.item_description,
    p.status,
    p.matched_trip_id,
    p.user_id,
    p.label_number,
    p.estimated_price,
    p.delivery_method,
    p.created_at,
    p.purchase_origin,
    p.package_destination,
    -- Extract lightweight product data, excluding photos/base64
    CASE 
      WHEN p.products_data IS NOT NULL THEN
        (SELECT jsonb_agg(
          jsonb_build_object(
            'itemDescription', elem->>'itemDescription',
            'name', elem->>'name',
            'estimatedPrice', elem->>'estimatedPrice',
            'quantity', elem->>'quantity',
            'itemLink', elem->>'itemLink',
            'cancelled', COALESCE((elem->>'cancelled')::boolean, false),
            'receivedAtOffice', COALESCE((elem->>'receivedAtOffice')::boolean, false),
            'notArrived', COALESCE((elem->>'notArrived')::boolean, false)
          )
        ) FROM jsonb_array_elements(p.products_data) AS elem)
      ELSE NULL
    END as products_summary,
    p.confirmed_delivery_address,
    -- Trip data
    t.from_city as trip_from_city,
    t.to_city as trip_to_city,
    t.arrival_date as trip_arrival_date,
    t.delivery_date as trip_delivery_date,
    t.status as trip_status,
    t.user_id as trip_user_id,
    -- Shopper profile
    sp.first_name as shopper_first_name,
    sp.last_name as shopper_last_name,
    -- Traveler profile
    tp.first_name as traveler_first_name,
    tp.last_name as traveler_last_name,
    tp.phone_number as traveler_phone,
    tp.country_code as traveler_country_code
  FROM packages p
  LEFT JOIN trips t ON t.id = p.matched_trip_id
  LEFT JOIN profiles sp ON sp.id = p.user_id
  LEFT JOIN profiles tp ON tp.id = t.user_id
  WHERE p.status IN (
    'in_transit', 
    'received_by_traveler', 
    'pending_office_confirmation',
    'delivered_to_office',
    'ready_for_pickup',
    'ready_for_delivery'
  )
    AND p.matched_trip_id IS NOT NULL
  ORDER BY p.created_at DESC;
END;
$$;