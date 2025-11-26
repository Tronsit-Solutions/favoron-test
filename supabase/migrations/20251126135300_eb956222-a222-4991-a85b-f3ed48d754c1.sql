-- Drop both duplicate versions of get_admin_packages_paginated
DROP FUNCTION IF EXISTS public.get_admin_packages_paginated(integer, integer, text, text, uuid);
DROP FUNCTION IF EXISTS public.get_admin_packages_paginated(integer, integer, text, uuid, text);

-- Create single clean version of get_admin_packages_paginated
CREATE OR REPLACE FUNCTION public.get_admin_packages_paginated(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_status text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_trip_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  item_description text,
  item_link text,
  estimated_price numeric,
  purchase_origin text,
  package_destination text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  quote jsonb,
  matched_trip_id uuid,
  payment_receipt jsonb,
  purchase_confirmation jsonb,
  tracking_info jsonb,
  office_delivery jsonb,
  rejection_reason text,
  wants_requote boolean,
  additional_notes text,
  quote_expires_at timestamptz,
  matched_assignment_expires_at timestamptz,
  traveler_address jsonb,
  matched_trip_dates jsonb,
  admin_assigned_tip numeric,
  products_data jsonb,
  weight numeric,
  traveler_rejection jsonb,
  shopper_name text,
  traveler_name text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_count bigint;
BEGIN
  -- Get total count first (simple, fast)
  SELECT COUNT(*) INTO v_total_count
  FROM packages p
  WHERE (p_status IS NULL OR p.status = p_status)
    AND (p_search IS NULL OR p.item_description ILIKE '%' || p_search || '%')
    AND (p_trip_id IS NULL OR p.matched_trip_id = p_trip_id);

  -- Return paginated results with joined data
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.item_description,
    p.item_link,
    p.estimated_price,
    p.purchase_origin,
    p.package_destination,
    p.status,
    p.created_at,
    p.updated_at,
    p.quote,
    p.matched_trip_id,
    p.payment_receipt,
    p.purchase_confirmation,
    p.tracking_info,
    p.office_delivery,
    p.rejection_reason,
    p.wants_requote,
    p.additional_notes,
    p.quote_expires_at,
    p.matched_assignment_expires_at,
    p.traveler_address,
    p.matched_trip_dates,
    p.admin_assigned_tip,
    p.products_data,
    p.weight,
    p.traveler_rejection,
    CONCAT(shopper.first_name, ' ', shopper.last_name) as shopper_name,
    CONCAT(traveler.first_name, ' ', traveler.last_name) as traveler_name,
    v_total_count as total_count
  FROM packages p
  LEFT JOIN profiles shopper ON shopper.id = p.user_id
  LEFT JOIN trips t ON t.id = p.matched_trip_id
  LEFT JOIN profiles traveler ON traveler.id = t.user_id
  WHERE (p_status IS NULL OR p.status = p_status)
    AND (p_search IS NULL OR p.item_description ILIKE '%' || p_search || '%')
    AND (p_trip_id IS NULL OR p.matched_trip_id = p_trip_id)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;