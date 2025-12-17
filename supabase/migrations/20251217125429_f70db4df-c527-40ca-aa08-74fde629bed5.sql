-- Primero eliminar la función existente
DROP FUNCTION IF EXISTS public.get_all_operations_data();

-- Crear función optimizada removiendo estados no usados (completed, out_for_delivery)
CREATE OR REPLACE FUNCTION public.get_all_operations_data()
RETURNS TABLE(
  confirmed_delivery_address jsonb,
  created_at timestamp with time zone,
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
  trip_arrival_date timestamp with time zone,
  trip_delivery_date timestamp with time zone,
  trip_from_city text,
  trip_status text,
  trip_to_city text,
  trip_user_id uuid,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    p.products_data as products_summary,
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
    'in_transit', 
    'received_by_traveler', 
    'pending_office_confirmation', 
    'delivered_to_office', 
    'ready_for_pickup', 
    'ready_for_delivery'
  )
  AND p.matched_trip_id IS NOT NULL
  ORDER BY p.created_at DESC;
END;
$function$;

-- Crear índice parcial optimizado para operaciones
DROP INDEX IF EXISTS idx_packages_operations_status;
CREATE INDEX idx_packages_operations_status 
ON packages (status, matched_trip_id, created_at DESC) 
WHERE status IN ('in_transit', 'received_by_traveler', 'pending_office_confirmation', 
                 'delivered_to_office', 'ready_for_pickup', 'ready_for_delivery')
  AND matched_trip_id IS NOT NULL;