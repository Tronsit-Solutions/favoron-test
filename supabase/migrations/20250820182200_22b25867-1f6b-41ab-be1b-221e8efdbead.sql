
-- Función segura para exponer viajes públicos con solo columnas no sensibles
CREATE OR REPLACE FUNCTION public.get_public_trips()
RETURNS TABLE (
  id uuid,
  from_city text,
  to_city text,
  arrival_date timestamptz,
  departure_date timestamptz,
  status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    t.id,
    t.from_city,
    t.to_city,
    t.arrival_date,
    t.departure_date,
    t.status
  FROM public.trips t
  WHERE t.status IN ('approved', 'active')
  ORDER BY t.departure_date ASC;
$$;

-- Otorgar permisos de ejecución a roles de API
GRANT EXECUTE ON FUNCTION public.get_public_trips() TO anon, authenticated;
