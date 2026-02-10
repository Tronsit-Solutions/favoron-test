
DROP FUNCTION IF EXISTS public.search_operations_packages(text);

CREATE FUNCTION public.search_operations_packages(search_term text)
RETURNS TABLE(
  package_id uuid,
  package_status text,
  item_description text,
  label_number integer,
  estimated_price numeric,
  created_at timestamptz,
  delivery_deadline timestamptz,
  products_data jsonb,
  shopper_first_name text,
  shopper_last_name text,
  traveler_first_name text,
  traveler_last_name text,
  from_city text,
  to_city text,
  matched_trip_id uuid,
  trip_arrival_date date,
  trip_delivery_date date,
  trip_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  term_as_number integer;
BEGIN
  BEGIN
    term_as_number := search_term::integer;
  EXCEPTION WHEN OTHERS THEN
    term_as_number := NULL;
  END;

  RETURN QUERY
  SELECT
    p.id AS package_id,
    p.status AS package_status,
    p.item_description,
    p.label_number,
    p.estimated_price,
    p.created_at,
    p.delivery_deadline,
    p.products_data::jsonb,
    shopper.first_name AS shopper_first_name,
    shopper.last_name AS shopper_last_name,
    traveler.first_name AS traveler_first_name,
    traveler.last_name AS traveler_last_name,
    t.from_city,
    t.to_city,
    p.matched_trip_id,
    t.arrival_date::date AS trip_arrival_date,
    t.delivery_date::date AS trip_delivery_date,
    t.status AS trip_status
  FROM packages p
  LEFT JOIN profiles shopper ON shopper.id = p.user_id
  LEFT JOIN trips t ON t.id = p.matched_trip_id
  LEFT JOIN profiles traveler ON traveler.id = t.user_id
  WHERE p.status IN (
    'paid','pending_purchase','purchased','in_transit',
    'received_by_traveler','pending_office_confirmation',
    'delivered_to_office','ready_for_pickup','ready_for_delivery',
    'out_for_delivery','completed'
  )
  AND (
    p.id::text ILIKE '%' || search_term || '%'
    OR p.item_description ILIKE '%' || search_term || '%'
    OR (shopper.first_name || ' ' || shopper.last_name) ILIKE '%' || search_term || '%'
    OR shopper.first_name ILIKE '%' || search_term || '%'
    OR shopper.last_name ILIKE '%' || search_term || '%'
    OR (traveler.first_name || ' ' || traveler.last_name) ILIKE '%' || search_term || '%'
    OR traveler.first_name ILIKE '%' || search_term || '%'
    OR traveler.last_name ILIKE '%' || search_term || '%'
    OR (term_as_number IS NOT NULL AND p.label_number = term_as_number)
  )
  ORDER BY p.created_at DESC
  LIMIT 50;
END;
$$;
