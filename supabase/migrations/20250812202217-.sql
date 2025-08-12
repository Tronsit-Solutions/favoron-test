-- Fix Security Definer View vulnerability
-- The public_profiles view should use SECURITY INVOKER instead of defaulting to SECURITY DEFINER

-- Drop and recreate the view with proper security settings
DROP VIEW IF EXISTS public.public_profiles;

-- Create the view with SECURITY INVOKER to use the querying user's permissions
-- This means the view will respect the RLS policies of the underlying profiles table
CREATE VIEW public.public_profiles 
WITH (security_invoker = true) AS
SELECT 
  id,
  first_name,
  last_name,
  username,
  avatar_url,
  created_at
FROM public.profiles;