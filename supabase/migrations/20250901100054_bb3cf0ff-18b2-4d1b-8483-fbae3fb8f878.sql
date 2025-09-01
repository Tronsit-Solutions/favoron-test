-- 1) Create or replace handle_new_user to enrich profiles from auth.identities (Google, etc.)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  id_data jsonb;
  v_name text;
  v_given text;
  v_family text;
  v_first text;
  v_last text;
  v_avatar text;
  v_username text;
BEGIN
  -- Prefer Google identity data when available; otherwise pick any identity
  SELECT i.identity_data
  INTO id_data
  FROM auth.identities i
  WHERE i.user_id = NEW.id
  ORDER BY CASE WHEN i.provider = 'google' THEN 0 ELSE 1 END, i.created_at ASC
  LIMIT 1;

  v_given := COALESCE(NEW.raw_user_meta_data->>'first_name', id_data->>'given_name');
  v_family := COALESCE(NEW.raw_user_meta_data->>'last_name', id_data->>'family_name');
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', id_data->>'name');

  IF v_given IS NULL AND v_name IS NOT NULL THEN
    v_given := split_part(v_name, ' ', 1);
  END IF;

  IF v_family IS NULL AND v_name IS NOT NULL THEN
    v_family := btrim(substr(v_name, length(split_part(v_name,' ',1)) + 2));
    IF v_family = '' THEN v_family := NULL; END IF;
  END IF;

  v_avatar := COALESCE(NEW.raw_user_meta_data->>'avatar_url', id_data->>'picture');

  -- Best-effort username from name
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NULLIF(regexp_replace(lower(COALESCE(v_name, v_given || COALESCE(' '||v_family, ''))), '\s+', '_', 'g'), '')
  );

  INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url, username)
  VALUES (NEW.id, NEW.email, v_given, v_family, v_avatar, v_username)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(public.profiles.first_name, EXCLUDED.first_name),
    last_name = COALESCE(public.profiles.last_name, EXCLUDED.last_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = now();

  RETURN NEW;
END;
$$;

-- 2) Ensure trigger exists on auth.users to call handle_new_user on sign up
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'on_auth_user_created'
      AND n.nspname = 'auth'
      AND c.relname = 'users'
  ) THEN
    -- Drop and recreate to point to the updated function safely
    DROP TRIGGER on_auth_user_created ON auth.users;
  END IF;

  CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
END $$;

-- 3) Backfill existing profiles missing names/avatars from identities (prefer Google)
WITH identities AS (
  SELECT 
    u.id AS user_id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'first_name', id.identity_data->>'given_name') AS given_name,
    COALESCE(u.raw_user_meta_data->>'last_name', id.identity_data->>'family_name') AS family_name,
    COALESCE(u.raw_user_meta_data->>'name', id.identity_data->>'name') AS full_name,
    COALESCE(u.raw_user_meta_data->>'avatar_url', id.identity_data->>'picture') AS picture
  FROM auth.users u
  LEFT JOIN LATERAL (
    SELECT i.identity_data
    FROM auth.identities i
    WHERE i.user_id = u.id
    ORDER BY CASE WHEN i.provider = 'google' THEN 0 ELSE 1 END, i.created_at ASC
    LIMIT 1
  ) id ON TRUE
)
UPDATE public.profiles p
SET
  email = COALESCE(p.email, i.email),
  first_name = COALESCE(p.first_name, COALESCE(i.given_name, split_part(i.full_name, ' ', 1))),
  last_name = COALESCE(
    p.last_name,
    COALESCE(
      i.family_name,
      NULLIF(btrim(substr(i.full_name, length(split_part(i.full_name,' ',1)) + 2)), '')
    )
  ),
  avatar_url = COALESCE(p.avatar_url, i.picture),
  updated_at = now()
FROM identities i
WHERE p.id = i.user_id
  AND (
    p.first_name IS NULL OR p.last_name IS NULL OR p.avatar_url IS NULL OR p.email IS NULL
  );