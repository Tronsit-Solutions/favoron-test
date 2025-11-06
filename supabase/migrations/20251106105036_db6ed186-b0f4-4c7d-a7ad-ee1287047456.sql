-- Agregar campos de ban a la función admin_view_all_users
DROP FUNCTION IF EXISTS public.admin_view_all_users(text);

CREATE OR REPLACE FUNCTION public.admin_view_all_users(_access_reason text DEFAULT 'Admin dashboard access')
RETURNS TABLE (
  id uuid,
  email text,
  first_name text,
  last_name text,
  username text,
  avatar_url text,
  phone_number text,
  country_code text,
  trust_level text,
  created_at timestamptz,
  user_role text,
  -- Campos de ban (NUEVOS)
  is_banned boolean,
  banned_until timestamptz,
  ban_reason text,
  banned_by uuid,
  banned_at timestamptz,
  -- Campos financieros
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
  -- Verificar acceso admin
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
  ) VALUES (
    auth.uid(),
    auth.uid(),
    'bulk_user_view',
    _access_reason
  );

  -- Retornar datos completos incluyendo campos de ban
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.username,
    p.avatar_url,
    p.phone_number,
    p.country_code,
    p.trust_level::text,
    p.created_at,
    COALESCE(ur.role::text, 'user') as user_role,
    -- Campos de ban (NUEVOS)
    p.is_banned,
    p.banned_until,
    p.ban_reason,
    p.banned_by,
    p.banned_at,
    -- Campos financieros
    ufd.bank_account_holder,
    ufd.bank_name,
    ufd.bank_account_type,
    ufd.bank_account_number,
    ufd.bank_swift_code,
    ufd.document_type,
    ufd.document_number
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.id
  LEFT JOIN LATERAL (
    SELECT *
    FROM user_financial_data
    WHERE user_id = p.id
    ORDER BY updated_at DESC
    LIMIT 1
  ) ufd ON true
  ORDER BY p.created_at DESC;
END;
$$;