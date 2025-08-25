
-- 1) Eliminar triggers duplicados y recrear un único trigger estable
DROP TRIGGER IF EXISTS on_auth_user_created_insert_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2) Función robusta para crear/sincronizar el perfil y asignar rol
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username text;
  candidate_username text;
  attempt int := 0;
BEGIN
  -- Derivar un username base desde metadatos o el email
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  base_username := lower(regexp_replace(COALESCE(base_username, 'usuario'), '[^a-zA-Z0-9_]+', '_', 'g'));
  candidate_username := NULLIF(base_username, '');

  -- Intentar insertar/actualizar perfil, resolviendo conflictos de username
  LOOP
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
        candidate_username,
        COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.raw_user_meta_data->>'phone'),
        NEW.raw_user_meta_data->>'document_type',
        COALESCE(NEW.raw_user_meta_data->>'document_number', NEW.raw_user_meta_data->>'id_number'),
        COALESCE(NEW.raw_user_meta_data->>'country_code', '+502'),
        NEW.email,
        now(),
        now()
      )
      ON CONFLICT (id) DO UPDATE SET
        first_name     = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
        last_name      = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
        username       = COALESCE(EXCLUDED.username, public.profiles.username),
        phone_number   = COALESCE(EXCLUDED.phone_number, public.profiles.phone_number),
        document_type  = COALESCE(EXCLUDED.document_type, public.profiles.document_type),
        document_number= COALESCE(EXCLUDED.document_number, public.profiles.document_number),
        country_code   = COALESCE(EXCLUDED.country_code, public.profiles.country_code),
        email          = COALESCE(EXCLUDED.email, public.profiles.email),
        updated_at     = now();

      EXIT; -- éxito: salir del bucle

    EXCEPTION WHEN unique_violation THEN
      -- Conflicto probable por username duplicado. Generar variante y reintentar.
      attempt := attempt + 1;

      IF attempt >= 10 THEN
        -- Como último recurso, guardar sin username para no bloquear el alta.
        candidate_username := NULL;

      ELSE
        -- Generar sufijo de 4 dígitos aleatorios y reintentar
        candidate_username := base_username || lpad((trunc(random()*10000))::int::text, 4, '0');
      END IF;
      -- Reintenta el loop
    END;
  END LOOP;

  -- Asegurar rol por defecto
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3) Crear un único trigger limpio
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4) Backfill de roles para usuarios ya existentes
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'
FROM auth.users u
LEFT JOIN public.user_roles r
  ON r.user_id = u.id AND r.role = 'user'
WHERE r.user_id IS NULL;
