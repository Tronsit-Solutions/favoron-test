-- Desactivar A/B test: Todos los nuevos usuarios serán asignados al Grupo A
-- Grupo A tiene 2.2x mejor conversión (0.97%) vs Grupo B (0.44%)

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
  v_full_name text;
  v_ab_group text;
  v_identity_data jsonb;
BEGIN
  -- A/B test desactivado: Grupo A tiene mejor conversión (2.2x)
  v_ab_group := 'A';

  -- Check if this is a Google OAuth signup by looking at identities
  SELECT identity_data INTO v_identity_data
  FROM auth.identities
  WHERE user_id = NEW.id
  AND provider = 'google'
  LIMIT 1;

  IF v_identity_data IS NOT NULL THEN
    -- Google OAuth: Extract data from identity_data
    v_first_name := COALESCE(
      v_identity_data->>'given_name',
      split_part(COALESCE(v_identity_data->>'name', v_identity_data->>'full_name', ''), ' ', 1)
    );
    v_last_name := COALESCE(
      v_identity_data->>'family_name',
      CASE 
        WHEN position(' ' in COALESCE(v_identity_data->>'name', v_identity_data->>'full_name', '')) > 0 
        THEN substring(COALESCE(v_identity_data->>'name', v_identity_data->>'full_name', '') from position(' ' in COALESCE(v_identity_data->>'name', v_identity_data->>'full_name', '')) + 1)
        ELSE NULL
      END
    );
    v_avatar_url := COALESCE(
      v_identity_data->>'picture',
      v_identity_data->>'avatar_url'
    );
  ELSE
    -- Normal email signup: Use raw_user_meta_data
    v_first_name := COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1)
    );
    v_last_name := COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      CASE 
        WHEN position(' ' in COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')) > 0 
        THEN substring(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '') from position(' ' in COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')) + 1)
        ELSE NULL
      END
    );
    v_avatar_url := COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    );
  END IF;

  INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url, ab_test_group)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(TRIM(v_first_name), ''),
    NULLIF(TRIM(v_last_name), ''),
    v_avatar_url,
    v_ab_group
  );

  RETURN NEW;
END;
$$;