-- Fix critical security vulnerability in profiles table RLS policy
-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "Authenticated users and admins can view profiles" ON public.profiles;

-- Create a new, properly structured policy that strictly separates user and admin access
CREATE POLICY "Users can view own profile, admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  (auth.uid() = id) OR verify_admin_access()
);

-- Add audit logging when admin access is used for profile viewing
-- This helps track when admins access user profiles for security monitoring
CREATE OR REPLACE FUNCTION public.log_admin_profile_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if this is an admin accessing someone else's profile
  IF auth.uid() != NEW.id AND verify_admin_access() THEN
    INSERT INTO public.admin_profile_access_log (
      admin_user_id,
      accessed_profile_id,
      access_type,
      reason,
      session_info
    ) VALUES (
      auth.uid(),
      NEW.id,
      'profile_view',
      'RLS policy admin access',
      jsonb_build_object(
        'timestamp', NOW(),
        'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent',
        'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;