-- Add delivery_method column to trips table
ALTER TABLE public.trips ADD COLUMN delivery_method text DEFAULT 'oficina';

-- Update the column comment
COMMENT ON COLUMN public.trips.delivery_method IS 'How the traveler will deliver packages in Guatemala: oficina, mensajero, pickup';

-- Add check constraint to ensure valid values
ALTER TABLE public.trips ADD CONSTRAINT trips_delivery_method_check 
CHECK (delivery_method IN ('oficina', 'mensajero', 'pickup'));

-- Create index for better performance
CREATE INDEX idx_trips_delivery_method ON public.trips(delivery_method);