-- Recrear la función admin_view_all_users que se eliminó con el CASCADE

CREATE OR REPLACE FUNCTION public.admin_view_all_users(_access_reason text)
RETURNS TABLE (
  id uuid,
  email text,
  first_name text,
  last_name text,
  username text,
  trust_level text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify admin access
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Log the access
  INSERT INTO admin_profile_access_log (
    admin_user_id,
    accessed_profile_id,
    access_type,
    reason
  )
  SELECT 
    auth.uid(),
    p.id,
    'bulk_user_view',
    _access_reason
  FROM profiles p;

  -- Return user data
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.username,
    p.trust_level::text,
    p.created_at
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$$;