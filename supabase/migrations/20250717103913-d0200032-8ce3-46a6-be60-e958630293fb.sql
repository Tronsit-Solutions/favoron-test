-- Enable real-time for packages table
ALTER TABLE packages REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE packages;