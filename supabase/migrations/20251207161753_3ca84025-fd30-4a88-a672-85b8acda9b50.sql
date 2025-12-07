-- Add platform fee columns to favoron_company_information table
ALTER TABLE public.favoron_company_information 
ADD COLUMN IF NOT EXISTS service_fee_rate_standard NUMERIC DEFAULT 0.40,
ADD COLUMN IF NOT EXISTS service_fee_rate_prime NUMERIC DEFAULT 0.20,
ADD COLUMN IF NOT EXISTS delivery_fee_guatemala_city NUMERIC DEFAULT 25,
ADD COLUMN IF NOT EXISTS delivery_fee_outside_city NUMERIC DEFAULT 60,
ADD COLUMN IF NOT EXISTS prime_delivery_discount NUMERIC DEFAULT 25,
ADD COLUMN IF NOT EXISTS prime_membership_price NUMERIC DEFAULT 200;

-- Update existing record with default values if they exist
UPDATE public.favoron_company_information
SET 
  service_fee_rate_standard = COALESCE(service_fee_rate_standard, 0.40),
  service_fee_rate_prime = COALESCE(service_fee_rate_prime, 0.20),
  delivery_fee_guatemala_city = COALESCE(delivery_fee_guatemala_city, 25),
  delivery_fee_outside_city = COALESCE(delivery_fee_outside_city, 60),
  prime_delivery_discount = COALESCE(prime_delivery_discount, 25),
  prime_membership_price = COALESCE(prime_membership_price, 200)
WHERE is_active = true;