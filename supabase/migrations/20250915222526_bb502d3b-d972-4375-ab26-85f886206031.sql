-- Drop and recreate admin_view_all_users function to fix banking data references
-- This resolves the "bank_account_holder does not exist" errors

DROP FUNCTION IF EXISTS public.admin_view_all_users(text);

CREATE OR REPLACE FUNCTION public.admin_view_all_users(_access_reason text DEFAULT 'Admin dashboard access')
RETURNS TABLE(
  id uuid,
  email text,
  first_name text,
  last_name text,
  username text,
  phone_number text,
  avatar_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  trust_level trust_level,
  user_role user_role,
  bank_account_holder text,
  bank_name text,
  bank_account_type text,
  bank_account_number text,
  bank_swift_code text,
  document_type text,
  document_number text,
  country_code text,
  email_notifications boolean,
  email_notification_preferences jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can view all user profiles';
  END IF;

  -- Log the access for audit purposes
  INSERT INTO public.admin_profile_access_log (
    admin_user_id,
    accessed_profile_id,
    access_type,
    reason
  ) VALUES (
    auth.uid(),
    NULL, -- NULL indicates bulk access
    'bulk_view_all_users',
    _access_reason
  );

  -- Return the data with correct JOIN to user_financial_data
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.username,
    p.phone_number,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    p.trust_level,
    COALESCE(ur.role, 'user'::user_role) as user_role,
    ufd.bank_account_holder,
    ufd.bank_name,
    ufd.bank_account_type,
    ufd.bank_account_number,
    ufd.bank_swift_code,
    ufd.document_type,
    ufd.document_number,
    p.country_code,
    p.email_notifications,
    p.email_notification_preferences
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  LEFT JOIN public.user_financial_data ufd ON ufd.user_id = p.id
  ORDER BY p.created_at DESC;
END;
$$;