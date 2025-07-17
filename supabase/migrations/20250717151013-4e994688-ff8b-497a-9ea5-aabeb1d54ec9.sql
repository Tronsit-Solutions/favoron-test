-- Add from_country column to trips table
ALTER TABLE public.trips 
ADD COLUMN from_country TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.trips.from_country IS 'Country of origin for the trip';

-- Create index for better performance when filtering by country
CREATE INDEX idx_trips_from_country ON public.trips(from_country) WHERE from_country IS NOT NULL;