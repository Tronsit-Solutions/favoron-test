-- Enable full replica identity for packages table to get complete row data in realtime updates
ALTER TABLE public.packages REPLICA IDENTITY FULL;