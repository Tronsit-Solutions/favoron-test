DROP FUNCTION IF EXISTS public.get_all_operations_data();

CREATE FUNCTION public.get_all_operations_data()
 RETURNS TABLE(
   id uuid, item_description text, status text, matched_trip_id uuid, user_id uuid, 
   label_number integer, estimated_price numeric, delivery_method text, 
   created_at timestamp with time zone, purchase_origin text, package_destination text, 
   products_summary jsonb, confirmed_delivery_address jsonb, incident_flag boolean,
   incident_status text, incident_history jsonb,
   shopper_first_name text, shopper_last_name text, shopper_name_override text,
   traveler_first_name text, traveler_last_name text, traveler_phone text, traveler_country_code text, 
   trip_from_city text, trip_to_city text, trip_arrival_date timestamp with time zone, 
   trip_delivery_date timestamp with time zone, trip_status text, trip_user_id uuid
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    p.incident_flag,
    p.incident_status,
    p.incident_history,
    shopper.first_name as shopper_first_name,
    shopper.last_name as shopper_last_name,
    p.shopper_name_override,
    traveler.first_name as traveler_first_name,
    traveler.last_name as traveler_last_name,
    traveler.phone_number as traveler_phone,
    traveler.country_code as traveler_country_code,
    t.from_city as trip_from_city,
    t.to_city as trip_to_city,
    t.arrival_date as trip_arrival_date,
    t.delivery_date as trip_delivery_date,
    t.status as trip_status,
    t.user_id as trip_user_id
  FROM packages p
  LEFT JOIN profiles shopper ON shopper.id = p.user_id
  LEFT JOIN trips t ON t.id = p.matched_trip_id
  LEFT JOIN profiles traveler ON traveler.id = t.user_id
  WHERE p.status IN (
    'paid', 'pending_purchase', 'purchased', 
    'in_transit', 'received_by_traveler', 'pending_office_confirmation', 
    'delivered_to_office', 'ready_for_pickup', 'ready_for_delivery'
  )
  ORDER BY p.created_at DESC;
$function$;