-- 1) Function to insert/update profiles from auth.users on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    username,
    phone_number,
    document_type,
    document_number,
    country_code,
    email,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.raw_user_meta_data->>'phone'),
    NEW.raw_user_meta_data->>'document_type',
    COALESCE(NEW.raw_user_meta_data->>'document_number', NEW.raw_user_meta_data->>'id_number'),
    COALESCE(NEW.raw_user_meta_data->>'country_code', '+502'),
    NEW.email,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
    username = COALESCE(EXCLUDED.username, public.profiles.username),
    phone_number = COALESCE(EXCLUDED.phone_number, public.profiles.phone_number),
    document_type = COALESCE(EXCLUDED.document_type, public.profiles.document_type),
    document_number = COALESCE(EXCLUDED.document_number, public.profiles.document_number),
    country_code = COALESCE(EXCLUDED.country_code, public.profiles.country_code),
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    updated_at = now();

  RETURN NEW;
END;
$$;

-- 2) Create trigger on auth.users only if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_insert_profile'
  ) THEN
    CREATE TRIGGER on_auth_user_created_insert_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 3) Backfill existing profiles with missing data from raw_user_meta_data (non-destructive)
UPDATE public.profiles p
SET
  username = COALESCE(p.username, au.raw_user_meta_data->>'username'),
  first_name = COALESCE(p.first_name, au.raw_user_meta_data->>'first_name'),
  last_name = COALESCE(p.last_name, au.raw_user_meta_data->>'last_name'),
  phone_number = COALESCE(p.phone_number, COALESCE(au.raw_user_meta_data->>'phone_number', au.raw_user_meta_data->>'phone')),
  document_type = COALESCE(p.document_type, au.raw_user_meta_data->>'document_type'),
  document_number = COALESCE(p.document_number, COALESCE(au.raw_user_meta_data->>'document_number', au.raw_user_meta_data->>'id_number')),
  country_code = COALESCE(p.country_code, COALESCE(au.raw_user_meta_data->>'country_code', '+502')),
  email = COALESCE(p.email, au.email),
  updated_at = now()
FROM auth.users au
WHERE p.id = au.id
  AND (
    p.username IS NULL OR
    p.first_name IS NULL OR
    p.last_name IS NULL OR
    p.phone_number IS NULL OR
    p.document_type IS NULL OR
    p.document_number IS NULL OR
    p.country_code IS NULL OR
    p.email IS NULL
  );