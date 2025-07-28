-- Crear función pública para obtener estadísticas de la aplicación
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS TABLE(
  total_packages_completed bigint,
  total_users bigint,
  total_trips bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.packages WHERE status IN ('completed', 'delivered_to_office', 'received_by_traveler'))::bigint as total_packages_completed,
    (SELECT COUNT(*) FROM public.profiles)::bigint as total_users,
    (SELECT COUNT(*) FROM public.trips)::bigint as total_trips;
END;
$$;