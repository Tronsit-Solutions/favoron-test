-- Create RPC function to get operations packages with lightweight products data
-- This extracts only essential fields, excluding heavy base64 images

CREATE OR REPLACE FUNCTION get_operations_packages(p_statuses text[])
RETURNS TABLE (
  id uuid,
  item_description text,
  status text,
  matched_trip_id uuid,
  user_id uuid,
  label_number integer,
  estimated_price numeric,
  delivery_method text,
  created_at timestamptz,
  purchase_origin text,
  package_destination text,
  products_summary jsonb
) AS $$
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
    -- Extract only lightweight fields from products_data, excluding photos/base64
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
    END as products_summary
  FROM packages p
  WHERE p.status = ANY(p_statuses)
    AND p.matched_trip_id IS NOT NULL
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;