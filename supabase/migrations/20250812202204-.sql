-- Fix Security Definer View vulnerability
-- The public_profiles view should use SECURITY INVOKER instead of defaulting to SECURITY DEFINER

-- Drop and recreate the view with proper security settings
DROP VIEW IF EXISTS public.public_profiles;

-- Create the view with SECURITY INVOKER to use the querying user's permissions
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

-- Add RLS policy for the view (since it now uses invoker's permissions)
-- This allows authenticated users to see public profile data
-- But the underlying profiles table RLS will still restrict access appropriately
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view public profile data"
ON public.public_profiles
FOR SELECT
TO authenticated
USING (true);