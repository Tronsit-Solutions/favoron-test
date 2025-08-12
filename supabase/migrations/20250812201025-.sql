-- Fix critical security vulnerability: Restrict profiles table access
-- Drop the overly permissive SELECT policy
DROP POLICY "Users can view all profiles" ON public.profiles;

-- Create a secure SELECT policy that only allows:
-- 1. Users to view their own profile
-- 2. Admins to view all profiles (for user management)
CREATE POLICY "Users can view own profile or admins can view all" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id 
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);

-- Create a public view for non-sensitive profile data that can be used for display purposes
-- This allows components to show user names/avatars without exposing sensitive data
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  first_name,
  last_name,
  username,
  avatar_url,
  created_at
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Create policy for the public view - this can be viewed by authenticated users
CREATE POLICY "Authenticated users can view public profile data"
ON public.public_profiles
FOR SELECT
TO authenticated
USING (true);