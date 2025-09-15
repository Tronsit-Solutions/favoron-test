-- Add last_mile_delivered column to trips table for efficient filtering in last mile deliveries
ALTER TABLE public.trips 
ADD COLUMN last_mile_delivered BOOLEAN NOT NULL DEFAULT FALSE;