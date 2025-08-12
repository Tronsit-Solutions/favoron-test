-- Fix critical security vulnerability: Restrict profiles table access
-- The previous migration failed, so we need to properly fix the RLS policies

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

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

-- Create a materialized view for public profile data (non-sensitive)
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