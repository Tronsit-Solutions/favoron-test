-- Enable real-time for packages table
ALTER TABLE public.packages REPLICA IDENTITY FULL;

-- Add the packages table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.packages;