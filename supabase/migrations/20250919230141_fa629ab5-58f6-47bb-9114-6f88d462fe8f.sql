-- Remove default value from country_code column in profiles table
ALTER TABLE public.profiles ALTER COLUMN country_code DROP DEFAULT;