
-- Remueve la unicidad en public.profiles.email para evitar que el trigger de alta falle
-- (La unicidad de email se mantiene en auth.users; profiles ya no bloqueará el registro)
DROP INDEX IF EXISTS public.profiles_email_unique_ci;
