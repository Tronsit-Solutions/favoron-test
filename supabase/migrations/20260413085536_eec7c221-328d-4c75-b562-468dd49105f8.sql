
CREATE OR REPLACE FUNCTION get_trip_assignments_with_packages(p_trip_id UUID)
RETURNS TABLE (
  id UUID,
  package_id UUID,
  status TEXT,
  admin_assigned_tip NUMERIC,
  quote JSONB,
  created_at TIMESTAMPTZ,
  pkg_item_description TEXT,
  pkg_estimated_price NUMERIC,
  pkg_purchase_origin TEXT,
  pkg_package_destination TEXT,
  pkg_user_id UUID,
  shopper_first_name TEXT,
  shopper_last_name TEXT,
  shopper_email TEXT,
  shopper_username TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pa.id, pa.package_id, pa.status,
    pa.admin_assigned_tip, pa.quote, pa.created_at,
    p.item_description, p.estimated_price,
    p.purchase_origin, p.package_destination, p.user_id,
    pr.first_name, pr.last_name, pr.email, pr.username
  FROM package_assignments pa
  LEFT JOIN packages p ON p.id = pa.package_id
  LEFT JOIN profiles pr ON pr.id = p.user_id
  WHERE pa.trip_id = p_trip_id
  ORDER BY pa.created_at DESC;
$$;
