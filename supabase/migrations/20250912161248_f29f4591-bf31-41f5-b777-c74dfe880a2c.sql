-- First, drop the existing insecure public_profiles view
DROP VIEW IF EXISTS public.public_profiles;

-- Create a security definer function that provides controlled access to profile data
CREATE OR REPLACE FUNCTION public.get_public_profile_data(target_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  username text,
  avatar_url text,
  created_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  is_admin boolean := false;
  current_user_id uuid := auth.uid();
BEGIN
  -- Check if current user is admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = current_user_id AND ur.role = 'admin'
  ) INTO is_admin;

  -- If no target user specified, return based on permissions
  IF target_user_id IS NULL THEN
    IF current_user_id IS NULL THEN
      -- Unauthenticated users get no data
      RETURN;
    ELSIF is_admin THEN
      -- Admins can see all profiles
      RETURN QUERY
      SELECT p.id, p.first_name, p.last_name, p.username, p.avatar_url, p.created_at
      FROM public.profiles p;
    ELSE
      -- Regular users can only see their own profile
      RETURN QUERY
      SELECT p.id, p.first_name, p.last_name, p.username, p.avatar_url, p.created_at
      FROM public.profiles p
      WHERE p.id = current_user_id;
    END IF;
  ELSE
    -- Specific user requested
    IF current_user_id IS NULL THEN
      -- Unauthenticated users get no data
      RETURN;
    ELSIF is_admin OR current_user_id = target_user_id THEN
      -- Admins or self can see full profile
      RETURN QUERY
      SELECT p.id, p.first_name, p.last_name, p.username, p.avatar_url, p.created_at
      FROM public.profiles p
      WHERE p.id = target_user_id;
    ELSE
      -- Other authenticated users can only see limited info (username and avatar)
      RETURN QUERY
      SELECT p.id, NULL::text, NULL::text, p.username, p.avatar_url, p.created_at
      FROM public.profiles p
      WHERE p.id = target_user_id;
    END IF;
  END IF;
END;
$$;

-- Create a secure view using the security definer function
-- This view will now respect the security rules defined in the function
CREATE VIEW public.public_profiles AS 
SELECT id, first_name, last_name, username, avatar_url, created_at 
FROM public.get_public_profile_data();

-- Grant necessary permissions
GRANT SELECT ON public.public_profiles TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_public_profile_data(uuid) TO authenticated, anon;