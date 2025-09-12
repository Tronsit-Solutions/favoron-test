-- Add additional security measures to the function
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
  -- Input validation: Ensure target_user_id is a valid UUID if provided
  IF target_user_id IS NOT NULL AND target_user_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Invalid user ID format';
  END IF;

  -- Check if current user is admin (with error handling)
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = current_user_id AND ur.role = 'admin'
    ) INTO is_admin;
  EXCEPTION WHEN OTHERS THEN
    is_admin := false;
  END;

  -- If no target user specified, return based on permissions
  IF target_user_id IS NULL THEN
    IF current_user_id IS NULL THEN
      -- Unauthenticated users get no data
      RETURN;
    ELSIF is_admin THEN
      -- Admins can see all profiles (with row limit for safety)
      RETURN QUERY
      SELECT p.id, p.first_name, p.last_name, p.username, p.avatar_url, p.created_at
      FROM public.profiles p
      LIMIT 1000; -- Prevent massive data exposure
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

-- Add comment explaining the security approach
COMMENT ON FUNCTION public.get_public_profile_data(uuid) IS 
'Secure function to access profile data with proper access controls. Uses SECURITY DEFINER to bypass RLS on profiles table while implementing custom authorization logic.';

-- Revoke and re-grant minimal necessary permissions
REVOKE ALL ON FUNCTION public.get_public_profile_data(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_profile_data(uuid) TO authenticated, anon;