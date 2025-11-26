-- Create RPC function for paginated admin packages with filters
CREATE OR REPLACE FUNCTION get_admin_packages_paginated(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_status TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_trip_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  item_description text,
  purchase_origin text,
  package_destination text,
  delivery_deadline timestamp with time zone,
  estimated_price numeric,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  quote jsonb,
  matched_trip_id uuid,
  products_data jsonb,
  payment_receipt jsonb,
  purchase_confirmation jsonb,
  tracking_info jsonb,
  traveler_confirmation jsonb,
  office_delivery jsonb,
  label_number integer,
  admin_assigned_tip numeric,
  incident_flag boolean,
  -- User profile fields
  user_email text,
  user_first_name text,
  user_last_name text,
  user_phone_number text,
  user_avatar_url text,
  -- Trip fields (if matched)
  trip_from_city text,
  trip_to_city text,
  trip_arrival_date timestamp with time zone,
  trip_departure_date timestamp with time zone,
  trip_user_id uuid,
  trip_user_email text,
  trip_user_first_name text,
  trip_user_last_name text,
  -- Total count for pagination
  total_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_packages AS (
    SELECT p.*
    FROM packages p
    WHERE 
      (p_status IS NULL OR p.status = p_status)
      AND (p_trip_id IS NULL OR p.matched_trip_id = p_trip_id)
      AND (
        p_search IS NULL OR 
        p.item_description ILIKE '%' || p_search || '%' OR
        p.purchase_origin ILIKE '%' || p_search || '%' OR
        p.package_destination ILIKE '%' || p_search || '%'
      )
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ),
  total AS (
    SELECT COUNT(*) as count
    FROM packages p
    WHERE 
      (p_status IS NULL OR p.status = p_status)
      AND (p_trip_id IS NULL OR p.matched_trip_id = p_trip_id)
      AND (
        p_search IS NULL OR 
        p.item_description ILIKE '%' || p_search || '%' OR
        p.purchase_origin ILIKE '%' || p_search || '%' OR
        p.package_destination ILIKE '%' || p_search || '%'
      )
  )
  SELECT 
    fp.id,
    fp.user_id,
    fp.item_description,
    fp.purchase_origin,
    fp.package_destination,
    fp.delivery_deadline,
    fp.estimated_price,
    fp.status,
    fp.created_at,
    fp.updated_at,
    fp.quote,
    fp.matched_trip_id,
    fp.products_data,
    fp.payment_receipt,
    fp.purchase_confirmation,
    fp.tracking_info,
    fp.traveler_confirmation,
    fp.office_delivery,
    fp.label_number,
    fp.admin_assigned_tip,
    fp.incident_flag,
    -- User profile
    up.email as user_email,
    up.first_name as user_first_name,
    up.last_name as user_last_name,
    up.phone_number as user_phone_number,
    up.avatar_url as user_avatar_url,
    -- Trip info
    t.from_city as trip_from_city,
    t.to_city as trip_to_city,
    t.arrival_date as trip_arrival_date,
    t.departure_date as trip_departure_date,
    t.user_id as trip_user_id,
    tp.email as trip_user_email,
    tp.first_name as trip_user_first_name,
    tp.last_name as trip_user_last_name,
    -- Total count
    total.count as total_count
  FROM filtered_packages fp
  LEFT JOIN profiles up ON up.id = fp.user_id
  LEFT JOIN trips t ON t.id = fp.matched_trip_id
  LEFT JOIN profiles tp ON tp.id = t.user_id
  CROSS JOIN total;
END;
$$;

-- Create index for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_packages_status_created ON packages(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_packages_matched_trip ON packages(matched_trip_id) WHERE matched_trip_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_packages_search ON packages USING gin(to_tsvector('spanish', item_description || ' ' || purchase_origin || ' ' || package_destination));