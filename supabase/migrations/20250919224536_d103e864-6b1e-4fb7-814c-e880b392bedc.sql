-- Consolidate phone numbers into single field for WhatsApp compatibility
-- This migration combines country_code and phone_number into a single phone_number field

-- First, update existing records to have full phone numbers in phone_number field
UPDATE public.profiles 
SET phone_number = CASE 
  -- If phone_number already has country code, keep it as is
  WHEN phone_number IS NOT NULL AND phone_number LIKE '+%' THEN phone_number
  -- If country_code exists and phone_number doesn't have +, combine them
  WHEN country_code IS NOT NULL AND phone_number IS NOT NULL AND phone_number NOT LIKE '+%' THEN 
    CONCAT(country_code, ' ', phone_number)
  -- If only country_code exists, use it
  WHEN country_code IS NOT NULL AND (phone_number IS NULL OR phone_number = '') THEN country_code
  -- Otherwise keep existing phone_number
  ELSE phone_number
END
WHERE phone_number IS NOT NULL OR country_code IS NOT NULL;

-- Update country_code to store just the extracted country code for reference
UPDATE public.profiles 
SET country_code = CASE 
  WHEN phone_number LIKE '+502%' THEN '+502'
  WHEN phone_number LIKE '+1%' THEN '+1'
  WHEN phone_number LIKE '+52%' THEN '+52'
  WHEN phone_number LIKE '+503%' THEN '+503'
  WHEN phone_number LIKE '+504%' THEN '+504'
  WHEN phone_number LIKE '+505%' THEN '+505'
  WHEN phone_number LIKE '+506%' THEN '+506'
  WHEN phone_number LIKE '+507%' THEN '+507'
  WHEN phone_number LIKE '+508%' THEN '+508'
  WHEN phone_number LIKE '+509%' THEN '+509'
  ELSE '+502' -- Default to Guatemala
END
WHERE phone_number IS NOT NULL;

-- Add a comment to clarify the new structure
COMMENT ON COLUMN public.profiles.phone_number IS 'Full WhatsApp number with country code (e.g., +502 1234 5678)';
COMMENT ON COLUMN public.profiles.country_code IS 'Country code extracted from phone_number for reference only';