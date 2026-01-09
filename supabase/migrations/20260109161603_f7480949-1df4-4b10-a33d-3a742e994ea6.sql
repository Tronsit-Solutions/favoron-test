-- Update handle_new_user() function to save phone_number and country_code from manual registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  id_data jsonb;
  v_name text;
  v_given text;
  v_family text;
  v_avatar text;
  v_username text;
  v_phone text;
  v_country_code text;
BEGIN
  -- 1. Get identity data (Google OAuth or other provider)
  SELECT i.identity_data
  INTO id_data
  FROM auth.identities i
  WHERE i.user_id = NEW.id
  ORDER BY CASE WHEN i.provider = 'google' THEN 0 ELSE 1 END, i.created_at ASC
  LIMIT 1;

  -- 2. Extract names from raw_user_meta_data first, then identity_data
  v_given := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    id_data->>'given_name'
  );
  v_family := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    id_data->>'family_name'
  );
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    id_data->>'name'
  );

  -- 3. Fallback for names from full name
  IF v_given IS NULL AND v_name IS NOT NULL THEN
    v_given := split_part(v_name, ' ', 1);
  END IF;

  IF v_family IS NULL AND v_name IS NOT NULL THEN
    v_family := btrim(substr(v_name, length(split_part(v_name,' ',1)) + 2));
    IF v_family = '' THEN v_family := NULL; END IF;
  END IF;

  -- 4. Avatar
  v_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    id_data->>'picture'
  );

  -- 5. Username
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NULLIF(regexp_replace(
      lower(COALESCE(v_name, v_given || COALESCE(' '||v_family, ''))), 
      '\s+', '_', 'g'
    ), '')
  );

  -- 6. Phone number and country code (for manual registration)
  v_phone := NEW.raw_user_meta_data->>'phone_number';
  v_country_code := NEW.raw_user_meta_data->>'country_code';

  -- 7. Insert profile with all fields including phone
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    avatar_url, 
    username,
    phone_number,
    country_code,
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
    CASE WHEN random() < 0.5 THEN 'A' ELSE 'B' END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(public.profiles.first_name, EXCLUDED.first_name),
    last_name = COALESCE(public.profiles.last_name, EXCLUDED.last_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    phone_number = COALESCE(public.profiles.phone_number, EXCLUDED.phone_number),
    country_code = COALESCE(public.profiles.country_code, EXCLUDED.country_code),
    ab_test_group = COALESCE(public.profiles.ab_test_group, EXCLUDED.ab_test_group),
    updated_at = now();

  RETURN NEW;
END;
$$;