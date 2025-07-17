-- Add messenger_pickup_info column to trips table
ALTER TABLE public.trips ADD COLUMN messenger_pickup_info jsonb;

-- Update the column comment
COMMENT ON COLUMN public.trips.messenger_pickup_info IS 'Information about messenger pickup location and instructions when delivery_method is mensajero';

-- Create index for better performance on messenger pickup info
CREATE INDEX idx_trips_messenger_pickup_info ON public.trips USING GIN(messenger_pickup_info);