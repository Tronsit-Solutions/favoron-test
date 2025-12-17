-- Optimizar get_all_operations_data para excluir fotos de products_data
-- Esto reduce la transferencia de datos de ~78MB a ~100KB

DROP FUNCTION IF EXISTS public.get_all_operations_data();

CREATE OR REPLACE FUNCTION public.get_all_operations_data()
RETURNS TABLE(
  confirmed_delivery_address jsonb,
  created_at timestamptz,
  delivery_method text,
  estimated_price numeric,
  id uuid,
  item_description text,
  label_number integer,
  matched_trip_id uuid,
  package_destination text,
  products_summary jsonb,
  purchase_origin text,
  shopper_first_name text,
  shopper_last_name text,
  status text,
  traveler_country_code text,
  traveler_first_name text,
  traveler_last_name text,
  traveler_phone text,
  trip_arrival_date timestamptz,
  trip_delivery_date timestamptz,
  trip_from_city text,
  trip_status text,
  trip_to_city text,
  trip_user_id uuid,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.confirmed_delivery_address,
    p.created_at,
    p.delivery_method,
    p.estimated_price,
    p.id,
    p.item_description,
    p.label_number,
    p.matched_trip_id,
    p.package_destination,
    -- Extraer solo campos necesarios de products_data, SIN fotos ni base64
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
    p.purchase_origin,
    shopper.first_name as shopper_first_name,
    shopper.last_name as shopper_last_name,
    p.status,
    traveler.country_code as traveler_country_code,
    traveler.first_name as traveler_first_name,
    traveler.last_name as traveler_last_name,
    traveler.phone_number as traveler_phone,
    t.arrival_date as trip_arrival_date,
    t.delivery_date as trip_delivery_date,
    t.from_city as trip_from_city,
    t.status as trip_status,
    t.to_city as trip_to_city,
    t.user_id as trip_user_id,
    p.user_id
  FROM packages p
  LEFT JOIN trips t ON t.id = p.matched_trip_id
  LEFT JOIN profiles shopper ON shopper.id = p.user_id
  LEFT JOIN profiles traveler ON traveler.id = t.user_id
  WHERE p.status IN (
    'in_transit', 'received_by_traveler', 'pending_office_confirmation', 
    'delivered_to_office', 'ready_for_pickup', 'ready_for_delivery'
  )
  AND p.matched_trip_id IS NOT NULL
  ORDER BY p.created_at DESC;
END;
$function$;