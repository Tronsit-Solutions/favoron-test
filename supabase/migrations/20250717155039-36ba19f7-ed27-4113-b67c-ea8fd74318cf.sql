-- Enable real-time updates for packages table
ALTER TABLE public.packages REPLICA IDENTITY FULL;

-- Add the table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.packages;