-- Eliminar los triggers que requieren número de teléfono
DROP TRIGGER IF EXISTS ensure_packages_user_has_phone ON public.packages;
DROP TRIGGER IF EXISTS ensure_trips_user_has_phone ON public.trips;

-- Eliminar la función de validación de teléfono
DROP FUNCTION IF EXISTS public.ensure_user_has_phone_number();