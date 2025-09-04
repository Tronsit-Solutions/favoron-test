-- Eliminar TODOS los triggers que dependen de la función ensure_user_has_phone_number
DROP TRIGGER IF EXISTS ensure_packages_user_has_phone ON public.packages;
DROP TRIGGER IF EXISTS ensure_trips_user_has_phone ON public.trips;
DROP TRIGGER IF EXISTS ensure_phone_before_insert_trips ON public.trips;
DROP TRIGGER IF EXISTS ensure_phone_before_insert_packages ON public.packages;
DROP TRIGGER IF EXISTS check_phone_before_package_insert ON public.packages;
DROP TRIGGER IF EXISTS check_phone_before_trip_insert ON public.trips;

-- Ahora eliminar la función sin dependencias
DROP FUNCTION IF EXISTS public.ensure_user_has_phone_number();