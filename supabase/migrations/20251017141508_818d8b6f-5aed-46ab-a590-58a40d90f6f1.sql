-- Fix admin profile access logging security issue
-- Drop the current admin policy that doesn't include logging
DROP POLICY IF EXISTS "Authenticated admins can view all profiles" ON public.profiles;

-- Create new admin policy with mandatory access logging
-- Using EXISTS to execute the logging function as a side effect
CREATE POLICY "Admins can view all profiles with audit logging"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Users can always view their own profile without logging
    auth.uid() = id 
    OR 
    -- Admins can view other profiles, but it gets logged automatically
    (verify_admin_access() AND
     -- Use EXISTS to call the logging function as a side effect
     (log_admin_profile_access(id, 'profile_view', 'Admin accessed user profile data') IS NULL OR true))
  )
);

-- Add comment explaining the security measure
COMMENT ON POLICY "Admins can view all profiles with audit logging" ON public.profiles IS 
'Security: Every admin access to user profiles (except their own) is automatically logged to admin_profile_access_log table. This creates an audit trail to detect unauthorized data access.';