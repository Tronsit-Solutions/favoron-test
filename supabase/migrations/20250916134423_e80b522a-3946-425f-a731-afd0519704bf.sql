-- Create admin function to view all users with their roles
CREATE OR REPLACE FUNCTION public.admin_view_all_users(_access_reason text DEFAULT 'Admin dashboard access')
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  email text,
  username text,
  avatar_url text,
  phone_number text,
  country_code text,
  trust_level trust_level,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  email_notifications boolean,
  prime_expires_at timestamp with time zone,
  user_role text,
  bank_account_holder text,
  bank_name text,
  bank_account_type text,
  bank_account_number text,
  bank_swift_code text,
  document_type text,
  document_number text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to access this function
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can view all users';
  END IF;

  -- Log the admin access
  PERFORM log_admin_profile_access(auth.uid(), 'bulk_view', _access_reason);

  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.username,
    p.avatar_url,
    p.phone_number,
    p.country_code,
    p.trust_level,
    p.created_at,
    p.updated_at,
    p.email_notifications,
    p.prime_expires_at,
    COALESCE(ur.role::text, 'user') as user_role,
    ufd.bank_account_holder,
    ufd.bank_name,
    ufd.bank_account_type,
    ufd.bank_account_number,
    ufd.bank_swift_code,
    ufd.document_type,
    ufd.document_number
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  LEFT JOIN public.user_financial_data ufd ON p.id = ufd.user_id
  ORDER BY p.created_at DESC;
END;
$$;