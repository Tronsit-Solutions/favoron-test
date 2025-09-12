-- Fix Security Definer View issue by removing the problematic public_profiles view
-- The view was calling a SECURITY DEFINER function, which creates a security risk

-- Drop the public_profiles view that was causing the security warning
DROP VIEW IF EXISTS public.public_profiles;

-- The get_public_profile_data() function is already secure and should be called directly
-- instead of through a view that bypasses RLS policies

-- Add a comment explaining why we removed the view
COMMENT ON FUNCTION public.get_public_profile_data(uuid) IS 
'Secure function to access profile data with proper access controls. Call this function directly instead of using views to maintain proper security boundaries. Views with SECURITY DEFINER functions can bypass RLS policies.';

-- Ensure the function has proper permissions
REVOKE ALL ON FUNCTION public.get_public_profile_data(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_profile_data(uuid) TO authenticated, anon;