-- Add column for Prime penalty exemption configuration
ALTER TABLE public.favoron_company_information 
ADD COLUMN IF NOT EXISTS prime_penalty_exempt BOOLEAN DEFAULT true;

-- Set default value for existing rows
UPDATE public.favoron_company_information 
SET prime_penalty_exempt = true 
WHERE prime_penalty_exempt IS NULL;