-- Add idempotency key to trips and enforce uniqueness when provided
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS client_request_id text;

-- Create a unique index only when the id is provided (allows nulls)
CREATE UNIQUE INDEX IF NOT EXISTS trips_client_request_id_unique
ON public.trips (client_request_id)
WHERE client_request_id IS NOT NULL;