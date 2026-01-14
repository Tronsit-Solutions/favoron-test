CREATE OR REPLACE FUNCTION public.admin_view_all_users(
  _access_reason text DEFAULT 'Admin dashboard access'::text,
  _row_limit integer DEFAULT 10000
)
RETURNS TABLE(
  id text,
  email text,
  first_name text,
  last_name text,
  username text,
  phone_number text,
  country_code text,
  avatar_url text,
  created_at text,
  trust_level text,
  user_role text,
  is_banned boolean,
  banned_at text,
  banned_until text,
  banned_by text,
  ban_reason text,
  bank_name text,
  bank_account_number text,
  bank_account_type text,
  bank_account_holder text,
  bank_swift_code text,
  document_type text,
  document_number text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify admin access
  IF NOT public.verify_admin_access() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Log the access
  PERFORM public.log_admin_profile_access('view_all_users', auth.uid()::text, _access_reason);

  RETURN QUERY
  SELECT 
    p.id::text,
    p.email::text,
    p.first_name::text,
    p.last_name::text,
    p.username::text,
    p.phone_number::text,
    p.country_code::text,
    p.avatar_url::text,
    p.created_at::text,
    p.trust_level::text,
    COALESCE(ur.role::text, 'user') as user_role,
    COALESCE(p.is_banned, false) as is_banned,
    p.banned_at::text,
    p.banned_until::text,
    p.banned_by::text,
    p.ban_reason::text,
    ufd.bank_name::text,
    ufd.bank_account_number::text,
    ufd.bank_account_type::text,
    ufd.bank_account_holder::text,
    ufd.bank_swift_code::text,
    ufd.document_type::text,
    ufd.document_number::text
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.id
  LEFT JOIN LATERAL (
    SELECT 
      f.bank_name,
      f.bank_account_number,
      f.bank_account_type,
      f.bank_account_holder,
      f.bank_swift_code,
      f.document_type,
      f.document_number
    FROM user_financial_data f
    WHERE f.user_id = p.id
    LIMIT 1
  ) ufd ON true
  ORDER BY p.created_at DESC
  LIMIT _row_limit;
END;
$function$;