-- Clean up empty string phone numbers and add validation constraints
-- This will fix the "Lucas Usuario" bypass issue

-- First, convert empty string phone numbers to NULL
UPDATE public.profiles 
SET phone_number = NULL 
WHERE phone_number = '' OR phone_number = ' ' OR TRIM(phone_number) = '';

-- Add a check constraint to prevent empty strings in phone_number
ALTER TABLE public.profiles 
ADD CONSTRAINT phone_number_not_empty 
CHECK (phone_number IS NULL OR TRIM(phone_number) != '');

-- Add similar constraints for first_name and last_name
ALTER TABLE public.profiles 
ADD CONSTRAINT first_name_not_empty 
CHECK (first_name IS NULL OR TRIM(first_name) != '');

ALTER TABLE public.profiles 
ADD CONSTRAINT last_name_not_empty 
CHECK (last_name IS NULL OR TRIM(last_name) != '');