-- Create secure admin function for updating profile fields with audit logging
CREATE OR REPLACE FUNCTION public.admin_update_profile_fields(
  _profile_id uuid,
  _updates jsonb,
  _reason text DEFAULT 'Admin profile update'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _admin_id uuid;
  _allowed_fields text[] := ARRAY[
    'first_name', 'last_name', 'phone_number', 'username', 
    'trust_level', 'email_notifications', 'email_notification_preferences',
    'bank_account_holder', 'bank_name', 'bank_account_type', 
    'bank_account_number', 'bank_swift_code', 'document_type', 
    'document_number', 'country_code'
  ];
  _field text;
  _update_data jsonb := '{}'::jsonb;
BEGIN
  -- Verify admin role
  _admin_id := auth.uid();
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update profile fields';
  END IF;

  -- Validate and filter allowed fields
  FOR _field IN SELECT jsonb_object_keys(_updates)
  LOOP
    IF _field = ANY(_allowed_fields) THEN
      _update_data := _update_data || jsonb_build_object(_field, _updates->_field);
    ELSE
      RAISE EXCEPTION 'Field % is not allowed for admin updates', _field;
    END IF;
  END LOOP;

  -- Perform the update with the filtered data
  IF jsonb_object_keys(_update_data) IS NOT NULL THEN
    UPDATE public.profiles 
    SET 
      first_name = COALESCE((_update_data->>'first_name'), first_name),
      last_name = COALESCE((_update_data->>'last_name'), last_name),
      phone_number = COALESCE((_update_data->>'phone_number'), phone_number),
      username = COALESCE((_update_data->>'username'), username),
      trust_level = COALESCE((_update_data->>'trust_level')::trust_level, trust_level),
      email_notifications = COALESCE((_update_data->>'email_notifications')::boolean, email_notifications),
      email_notification_preferences = COALESCE((_update_data->'email_notification_preferences'), email_notification_preferences),
      bank_account_holder = COALESCE((_update_data->>'bank_account_holder'), bank_account_holder),
      bank_name = COALESCE((_update_data->>'bank_name'), bank_name),
      bank_account_type = COALESCE((_update_data->>'bank_account_type'), bank_account_type),
      bank_account_number = COALESCE((_update_data->>'bank_account_number'), bank_account_number),
      bank_swift_code = COALESCE((_update_data->>'bank_swift_code'), bank_swift_code),
      document_type = COALESCE((_update_data->>'document_type'), document_type),
      document_number = COALESCE((_update_data->>'document_number'), document_number),
      country_code = COALESCE((_update_data->>'country_code'), country_code),
      updated_at = NOW()
    WHERE id = _profile_id;

    -- Log the admin action
    PERFORM log_admin_profile_access(
      _profile_id,
      'profile_update',
      _reason
    );
  END IF;
END;
$$;

-- Ensure admin_view_all_users is properly secured and audited
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

  -- Return the data
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
    p.bank_account_holder,
    p.bank_name,
    p.bank_account_type,
    p.bank_account_number,
    p.bank_swift_code,
    p.document_type,
    p.document_number,
    p.country_code,
    p.email_notifications,
    p.email_notification_preferences
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  ORDER BY p.created_at DESC;
END;
$$;