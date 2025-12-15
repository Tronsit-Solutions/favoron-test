-- Drop and recreate the function with simplified return type
DROP FUNCTION IF EXISTS public.get_all_operations_data();

CREATE OR REPLACE FUNCTION public.get_all_operations_data()
RETURNS TABLE(
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
  products_summary jsonb,
  confirmed_delivery_address jsonb,
  trip_user_id uuid,
  trip_from_city text,
  trip_to_city text,
  trip_arrival_date timestamptz,
  trip_delivery_date timestamptz,
  trip_status text,
  traveler_first_name text,
  traveler_last_name text,
  traveler_phone text,
  traveler_country_code text,
  shopper_first_name text,
  shopper_last_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    p.products_data as products_summary,
    p.confirmed_delivery_address,
    t.user_id as trip_user_id,
    t.from_city as trip_from_city,
    t.to_city as trip_to_city,
    t.arrival_date as trip_arrival_date,
    t.delivery_date as trip_delivery_date,
    t.status as trip_status,
    traveler.first_name as traveler_first_name,
    traveler.last_name as traveler_last_name,
    traveler.phone_number as traveler_phone,
    traveler.country_code as traveler_country_code,
    shopper.first_name as shopper_first_name,
    shopper.last_name as shopper_last_name
  FROM packages p
  LEFT JOIN trips t ON t.id = p.matched_trip_id
  LEFT JOIN profiles traveler ON traveler.id = t.user_id
  LEFT JOIN profiles shopper ON shopper.id = p.user_id
  WHERE p.status IN ('in_transit', 'received_by_traveler', 'pending_office_confirmation', 
                     'delivered_to_office', 'ready_for_pickup', 'ready_for_delivery', 'out_for_delivery', 'completed')
    AND p.matched_trip_id IS NOT NULL
  ORDER BY p.created_at DESC;
$$;