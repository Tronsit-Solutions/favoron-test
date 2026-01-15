-- Add document columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS document_type text,
ADD COLUMN IF NOT EXISTS document_number text;

-- Update the handle_new_user trigger to save document data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_given text;
  v_family text;
  v_avatar text;
  v_username text;
  v_phone text;
  v_country_code text;
  v_document_type text;
  v_document_number text;
BEGIN
  -- Google sign-in uses given_name / family_name
  v_given := COALESCE(
    NEW.raw_user_meta_data->>'given_name',
    NEW.raw_user_meta_data->>'first_name',
    split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1)
  );
  v_family := COALESCE(
    NEW.raw_user_meta_data->>'family_name',
    NEW.raw_user_meta_data->>'last_name',
    nullif(trim(substr(NEW.raw_user_meta_data->>'full_name', strpos(NEW.raw_user_meta_data->>'full_name', ' '))), '')
  );
  v_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );
  v_username := NEW.raw_user_meta_data->>'preferred_username';
  v_phone := NEW.raw_user_meta_data->>'phone_number';
  v_country_code := NEW.raw_user_meta_data->>'country_code';
  
  -- Extract document data from manual registration
  v_document_type := NEW.raw_user_meta_data->>'document_type';
  v_document_number := NEW.raw_user_meta_data->>'document_number';

  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    avatar_url,
    username,
    phone_number,
    country_code,
    document_type,
    document_number,
    ab_test_group
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_given,
    v_family,
    v_avatar,
    v_username,
    v_phone,
    v_country_code,
    v_document_type,
    v_document_number,
    CASE WHEN random() < 0.5 THEN 'A' ELSE 'B' END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    username = COALESCE(EXCLUDED.username, public.profiles.username),
    phone_number = COALESCE(EXCLUDED.phone_number, public.profiles.phone_number),
    country_code = COALESCE(EXCLUDED.country_code, public.profiles.country_code),
    document_type = COALESCE(EXCLUDED.document_type, public.profiles.document_type),
    document_number = COALESCE(EXCLUDED.document_number, public.profiles.document_number),
    updated_at = now();

  RETURN NEW;
END;
$$;