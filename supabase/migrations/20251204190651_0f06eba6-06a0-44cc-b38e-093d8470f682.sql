-- Add cancellation penalty amount column to favoron_company_information
ALTER TABLE favoron_company_information 
ADD COLUMN IF NOT EXISTS cancellation_penalty_amount NUMERIC DEFAULT 5;

-- Update existing record with default value
UPDATE favoron_company_information 
SET cancellation_penalty_amount = 5 
WHERE cancellation_penalty_amount IS NULL;