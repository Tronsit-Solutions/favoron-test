-- Add structured rejection fields to packages table
ALTER TABLE public.packages 
ADD COLUMN rejection_reason TEXT,
ADD COLUMN wants_requote BOOLEAN DEFAULT false;

-- Add check constraint for valid rejection reasons
ALTER TABLE public.packages 
ADD CONSTRAINT check_rejection_reason 
CHECK (rejection_reason IS NULL OR rejection_reason IN ('no_longer_want', 'too_expensive', 'wrong_delivery_time', 'other'));