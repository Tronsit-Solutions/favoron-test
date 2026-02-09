

## Fix: Guardar datos del registro en la base de datos desde el inicio

### Problema identificado

La funcion `handle_new_user()` (trigger que crea el perfil cuando un usuario se registra) fue **sobreescrita** por una migracion reciente (A/B test del 30 de enero 2026). La version actual solo guarda `id, email, first_name, last_name, avatar_url, ab_test_group`, **perdiendo** los campos:

- `phone_number` (WhatsApp)
- `country_code` (codigo de pais)
- `username` (nombre de usuario)
- `document_type` (tipo de documento)
- `document_number` (DPI/Pasaporte)

Esto causa que al registrarse, el perfil quede incompleto y el modal de "Completa tu perfil" aparezca inmediatamente.

### Solucion

#### 1. Migracion SQL: Restaurar el trigger completo

Crear una nueva migracion que reescriba `handle_new_user()` incluyendo todos los campos del registro:

```sql
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
BEGIN
  -- Check Google OAuth
  SELECT identity_data INTO v_identity_data
  FROM auth.identities
  WHERE user_id = NEW.id AND provider = 'google'
  LIMIT 1;

  IF v_identity_data IS NOT NULL THEN
    -- Google OAuth: extract from identity_data
    v_first_name := COALESCE(v_identity_data->>'given_name', ...);
    v_last_name := COALESCE(v_identity_data->>'family_name', ...);
    v_avatar_url := COALESCE(v_identity_data->>'picture', ...);
    -- Google no provee phone/document
    v_phone_number := NULL;
    v_country_code := NULL;
    v_username := NULL;
    v_document_type := NULL;
    v_document_number := NULL;
  ELSE
    -- Email signup: extract from raw_user_meta_data
    v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', ...);
    v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', ...);
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
```

Esto mantiene la logica de Google OAuth de la version actual pero agrega los campos faltantes del registro manual.

#### 2. Fix en AuthModal.tsx (registro desde modal)

El `AuthModal.tsx` pasa `phone_number` y `document_number` en el metadata, pero **no** pasa `country_code` ni `username`. Agregar `country_code` parseado del numero de telefono ingresado.

#### 3. Sin cambios en Auth.tsx

La pagina `Auth.tsx` ya pasa correctamente todos los campos (`first_name`, `last_name`, `country_code`, `phone_number`, `username`, `document_type`, `document_number`) en el `raw_user_meta_data`.

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| Nueva migracion SQL | Restaurar `handle_new_user()` con todos los campos |
| `src/components/AuthModal.tsx` | Agregar `country_code` y `username` al metadata de signup |

### Resultado esperado

Cuando un usuario se registra (por email o desde el modal), sus datos de nombre, telefono, DPI y username se guardan directamente en la tabla `profiles`. El modal de "Completa tu perfil" ya no aparecera para usuarios que completaron el formulario de registro.

