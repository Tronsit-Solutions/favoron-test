-- Migration: Fix handle_new_user trigger to correctly extract Google OAuth data
-- and backfill existing users with missing names

-- 1. Replace the handle_new_user function with robust Google OAuth support
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
BEGIN
  -- 1. Get identity data (Google OAuth or other provider)
  SELECT i.identity_data
  INTO id_data
  FROM auth.identities i
  WHERE i.user_id = NEW.id
  ORDER BY CASE WHEN i.provider = 'google' THEN 0 ELSE 1 END, i.created_at ASC
  LIMIT 1;

  -- 2. Extract name: first from raw_user_meta_data (normal registration), then identity_data (Google)
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

  -- 3. Fallback: If no given_name but we have full name, extract it
  IF v_given IS NULL AND v_name IS NOT NULL THEN
    v_given := split_part(v_name, ' ', 1);
  END IF;

  IF v_family IS NULL AND v_name IS NOT NULL THEN
    v_family := btrim(substr(v_name, length(split_part(v_name,' ',1)) + 2));
    IF v_family = '' THEN v_family := NULL; END IF;
  END IF;

  -- 4. Avatar: first raw_user_meta_data, then picture from Google
  v_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    id_data->>'picture'
  );

  -- 5. Username: generate from name
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NULLIF(regexp_replace(
      lower(COALESCE(v_name, v_given || COALESCE(' '||v_family, ''))), 
      '\s+', '_', 'g'
    ), '')
  );

  -- 6. Insert profile with random A/B test group
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    avatar_url, 
    username,
    ab_test_group
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    v_given, 
    v_family, 
    v_avatar, 
    v_username,
    CASE WHEN random() < 0.5 THEN 'A' ELSE 'B' END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(public.profiles.first_name, EXCLUDED.first_name),
    last_name = COALESCE(public.profiles.last_name, EXCLUDED.last_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    ab_test_group = COALESCE(public.profiles.ab_test_group, EXCLUDED.ab_test_group),
    updated_at = now();

  RETURN NEW;
END;
$$;

-- 2. Backfill existing users with missing names from Google OAuth identity data
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
  first_name = COALESCE(p.first_name, COALESCE(i.given_name, split_part(i.full_name, ' ', 1))),
  last_name = COALESCE(
    p.last_name,
    COALESCE(i.family_name, NULLIF(btrim(substr(i.full_name, length(split_part(i.full_name,' ',1)) + 2)), ''))
  ),
  avatar_url = COALESCE(p.avatar_url, i.picture),
  updated_at = now()
FROM identities i
WHERE p.id = i.user_id
  AND (p.first_name IS NULL OR p.last_name IS NULL);