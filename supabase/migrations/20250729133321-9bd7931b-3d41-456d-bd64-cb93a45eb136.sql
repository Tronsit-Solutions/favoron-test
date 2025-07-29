-- Actualizar la función get_public_stats para incluir tips repartidos
CREATE OR REPLACE FUNCTION public.get_public_stats()
 RETURNS TABLE(total_packages_completed bigint, total_users bigint, total_trips bigint, total_tips_distributed numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.packages WHERE status IN ('completed', 'delivered_to_office', 'received_by_traveler'))::bigint as total_packages_completed,
    (SELECT COUNT(*) FROM public.profiles)::bigint as total_users,
    (SELECT COUNT(*) FROM public.trips)::bigint as total_trips,
    (SELECT COALESCE(SUM((quote->>'price')::numeric), 0) 
     FROM public.packages 
     WHERE status IN ('completed', 'delivered_to_office', 'received_by_traveler') 
       AND quote IS NOT NULL 
       AND (quote->>'price') IS NOT NULL)::numeric as total_tips_distributed;
END;
$function$;