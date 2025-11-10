-- Clean up invalid phone numbers that only contain country code '+502' or '502'
-- These 51 records will have phone_number and country_code set to NULL

UPDATE profiles 
SET phone_number = NULL, 
    country_code = NULL,
    updated_at = NOW()
WHERE phone_number IN ('+502', '502') 
   OR TRIM(phone_number) IN ('+502', '502');