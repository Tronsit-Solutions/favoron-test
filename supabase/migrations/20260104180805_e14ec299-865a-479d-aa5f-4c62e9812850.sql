-- Fix search_path vulnerability for functions missing this security setting
-- This prevents potential search path injection attacks

-- 1. Fix audit_payment_order_admin_access (can use CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.audit_payment_order_admin_access(
  _order_id uuid,
  _access_type text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log the access for audit purposes
  INSERT INTO admin_profile_access_log (
    admin_user_id,
    accessed_profile_id,
    access_type,
    reason,
    session_info
  )
  SELECT 
    auth.uid(),
    po.traveler_id,
    'payment_order_' || _access_type,
    'Accessed payment order: ' || _order_id::text,
    jsonb_build_object('order_id', _order_id, 'timestamp', now())
  FROM payment_orders po
  WHERE po.id = _order_id;
END;
$$;

-- 2. Fix get_operations_packages (need DROP first due to return type)
DROP FUNCTION IF EXISTS public.get_operations_packages(text[]);

CREATE FUNCTION public.get_operations_packages(p_statuses text[])
RETURNS TABLE(
  id uuid, 
  item_description text, 
  status text, 
  matched_trip_id uuid, 
  user_id uuid, 
  label_number integer, 
  estimated_price numeric, 
  delivery_method text, 
  created_at timestamp with time zone, 
  purchase_origin text, 
  package_destination text, 
  products_summary jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
$$;

-- 3. Fix validate_payment_order_data
CREATE OR REPLACE FUNCTION public.validate_payment_order_data(
  _trip_id uuid,
  _traveler_id uuid,
  _amount numeric
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_trip_exists boolean;
  v_traveler_owns_trip boolean;
BEGIN
  -- Validate trip exists
  SELECT EXISTS(SELECT 1 FROM trips WHERE id = _trip_id) INTO v_trip_exists;
  IF NOT v_trip_exists THEN
    RETURN false;
  END IF;
  
  -- Validate traveler owns the trip
  SELECT EXISTS(
    SELECT 1 FROM trips 
    WHERE id = _trip_id AND user_id = _traveler_id
  ) INTO v_traveler_owns_trip;
  IF NOT v_traveler_owns_trip THEN
    RETURN false;
  END IF;
  
  -- Validate amount is positive
  IF _amount <= 0 THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;