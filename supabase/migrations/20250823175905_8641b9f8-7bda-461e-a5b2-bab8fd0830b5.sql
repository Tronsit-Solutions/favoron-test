-- Update RPC to only return trips from today onwards (by departure_date)
CREATE OR REPLACE FUNCTION public.get_public_trips()
 RETURNS TABLE(id uuid, from_city text, to_city text, arrival_date timestamp with time zone, departure_date timestamp with time zone, status text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    t.id,
    t.from_city,
    t.to_city,
    t.arrival_date,
    t.departure_date,
    t.status
  FROM public.trips t
  WHERE t.status IN ('approved', 'active')
    AND t.departure_date::date >= CURRENT_DATE
  ORDER BY t.departure_date ASC;
$function$