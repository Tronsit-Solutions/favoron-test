DROP FUNCTION IF EXISTS public.get_admin_trips_with_user();

CREATE OR REPLACE FUNCTION public.get_admin_trips_with_user()
RETURNS TABLE(id uuid, from_city text, to_city text, from_country text, to_country text, arrival_date text, delivery_date text, first_day_packages text, last_day_packages text, delivery_method text, messenger_pickup_info jsonb, package_receiving_address jsonb, status text, created_at text, updated_at text, user_id uuid, first_name text, last_name text, email text, phone_number text, username text, user_display_name text, available_space numeric, boost_code text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT
    t.id, t.from_city, t.to_city, t.from_country, t.to_country,
    t.arrival_date::text, t.delivery_date::text,
    t.first_day_packages::text, t.last_day_packages::text,
    t.delivery_method, t.messenger_pickup_info,
    t.package_receiving_address, t.status,
    t.created_at::text, t.updated_at::text, t.user_id,
    p.first_name, p.last_name, p.email, p.phone_number, p.username,
    CONCAT(p.first_name, ' ', p.last_name) as user_display_name,
    t.available_space,
    t.boost_code
  FROM public.trips t
  LEFT JOIN public.profiles p ON p.id = t.user_id
  ORDER BY t.created_at DESC;
$function$;