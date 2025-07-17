-- Add available_space column to trips table
ALTER TABLE public.trips 
ADD COLUMN available_space NUMERIC;

-- Add comment for documentation
COMMENT ON COLUMN public.trips.available_space IS 'Available space in kg that the traveler can carry';

-- Create index for better performance when filtering by available space
CREATE INDEX idx_trips_available_space ON public.trips(available_space) WHERE available_space IS NOT NULL;