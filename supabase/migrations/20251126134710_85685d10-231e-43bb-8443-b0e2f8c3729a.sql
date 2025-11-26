-- Drop the problematic GIN index
DROP INDEX IF EXISTS idx_packages_search;

-- Replace the RPC function with a simplified version
CREATE OR REPLACE FUNCTION get_admin_packages_paginated(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_status TEXT DEFAULT NULL,
  p_trip_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  item_description TEXT,
  purchase_origin TEXT,
  package_destination TEXT,
  estimated_price NUMERIC,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  delivery_deadline TIMESTAMPTZ,
  matched_trip_id UUID,
  quote JSONB,
  payment_receipt JSONB,
  purchase_confirmation JSONB,
  tracking_info JSONB,
  products_data JSONB,
  traveler_confirmation JSONB,
  office_delivery JSONB,
  label_number INTEGER,
  admin_assigned_tip NUMERIC,
  incident_flag BOOLEAN,
  user_email TEXT,
  user_first_name TEXT,
  user_last_name TEXT,
  user_phone_number TEXT,
  user_avatar_url TEXT,
  trip_from_city TEXT,
  trip_to_city TEXT,
  trip_departure_date TIMESTAMPTZ,
  trip_arrival_date TIMESTAMPTZ,
  trip_user_id UUID,
  trip_user_email TEXT,
  trip_user_first_name TEXT,
  trip_user_last_name TEXT,
  total_count BIGINT
) AS $$
DECLARE
  v_total_count BIGINT;
BEGIN
  -- Calculate total count once
  SELECT COUNT(*)
  INTO v_total_count
  FROM packages p
  WHERE (p_status IS NULL OR p.status = p_status)
    AND (p_trip_id IS NULL OR p.matched_trip_id = p_trip_id)
    AND (p_search IS NULL OR 
         p.item_description ILIKE '%' || p_search || '%' OR
         p.purchase_origin ILIKE '%' || p_search || '%' OR
         p.package_destination ILIKE '%' || p_search || '%');

  -- Return paginated results with total count
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.item_description,
    p.purchase_origin,
    p.package_destination,
    p.estimated_price,
    p.status,
    p.created_at,
    p.updated_at,
    p.delivery_deadline,
    p.matched_trip_id,
    p.quote,
    p.payment_receipt,
    p.purchase_confirmation,
    p.tracking_info,
    p.products_data,
    p.traveler_confirmation,
    p.office_delivery,
    p.label_number,
    p.admin_assigned_tip,
    p.incident_flag,
    up.email as user_email,
    up.first_name as user_first_name,
    up.last_name as user_last_name,
    up.phone_number as user_phone_number,
    up.avatar_url as user_avatar_url,
    t.from_city as trip_from_city,
    t.to_city as trip_to_city,
    t.departure_date as trip_departure_date,
    t.arrival_date as trip_arrival_date,
    t.user_id as trip_user_id,
    tp.email as trip_user_email,
    tp.first_name as trip_user_first_name,
    tp.last_name as trip_user_last_name,
    v_total_count as total_count
  FROM packages p
  LEFT JOIN profiles up ON up.id = p.user_id
  LEFT JOIN trips t ON t.id = p.matched_trip_id
  LEFT JOIN profiles tp ON tp.id = t.user_id
  WHERE (p_status IS NULL OR p.status = p_status)
    AND (p_trip_id IS NULL OR p.matched_trip_id = p_trip_id)
    AND (p_search IS NULL OR 
         p.item_description ILIKE '%' || p_search || '%' OR
         p.purchase_origin ILIKE '%' || p_search || '%' OR
         p.package_destination ILIKE '%' || p_search || '%')
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add efficient indexes
CREATE INDEX IF NOT EXISTS idx_packages_status_created ON packages(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_packages_matched_trip ON packages(matched_trip_id) WHERE matched_trip_id IS NOT NULL;