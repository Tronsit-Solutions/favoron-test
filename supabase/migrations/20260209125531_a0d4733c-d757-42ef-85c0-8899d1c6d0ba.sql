
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first_name text;
  v_last_name text;
  v_avatar_url text;
  v_phone_number text;
  v_country_code text;
  v_username text;
  v_document_type text;
  v_document_number text;
  v_identity_data jsonb;
  v_full_name text;
  v_name_parts text[];
BEGIN
  -- Check if user signed up with Google OAuth
  SELECT identity_data INTO v_identity_data
  FROM auth.identities
  WHERE user_id = NEW.id AND provider = 'google'
  LIMIT 1;

  IF v_identity_data IS NOT NULL THEN
    -- Google OAuth: extract from identity_data
    v_first_name := v_identity_data->>'given_name';
    v_last_name := v_identity_data->>'family_name';
    
    -- Fallback: parse full name if given_name/family_name not available
    IF v_first_name IS NULL AND v_last_name IS NULL THEN
      v_full_name := COALESCE(
        v_identity_data->>'name',
        v_identity_data->>'full_name',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name'
      );
      IF v_full_name IS NOT NULL THEN
        v_name_parts := string_to_array(v_full_name, ' ');
        v_first_name := v_name_parts[1];
        IF array_length(v_name_parts, 1) > 1 THEN
          v_last_name := array_to_string(v_name_parts[2:], ' ');
        END IF;
      END IF;
    END IF;
    
    v_avatar_url := COALESCE(
      v_identity_data->>'picture',
      v_identity_data->>'avatar_url',
      NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Google OAuth does not provide phone/document data
    v_phone_number := NULL;
    v_country_code := NULL;
    v_username := NULL;
    v_document_type := NULL;
    v_document_number := NULL;
  ELSE
    -- Email/password signup: extract from raw_user_meta_data
    v_first_name := COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'given_name'
    );
    v_last_name := COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'family_name'
    );
    v_avatar_url := NEW.raw_user_meta_data->>'avatar_url';
    v_phone_number := NEW.raw_user_meta_data->>'phone_number';
    v_country_code := NEW.raw_user_meta_data->>'country_code';
    v_username := NEW.raw_user_meta_data->>'username';
    v_document_type := NEW.raw_user_meta_data->>'document_type';
    v_document_number := NEW.raw_user_meta_data->>'document_number';
  END IF;

  INSERT INTO public.profiles (
    id, email, first_name, last_name, avatar_url,
    phone_number, country_code, username,
    document_type, document_number, ab_test_group
  ) VALUES (
    NEW.id, NEW.email, v_first_name, v_last_name, v_avatar_url,
    v_phone_number, v_country_code, v_username,
    v_document_type, v_document_number, 'A'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number),
    country_code = COALESCE(EXCLUDED.country_code, profiles.country_code),
    username = COALESCE(EXCLUDED.username, profiles.username),
    document_type = COALESCE(EXCLUDED.document_type, profiles.document_type),
    document_number = COALESCE(EXCLUDED.document_number, profiles.document_number),
    updated_at = now();

  RETURN NEW;
END;
$$;
