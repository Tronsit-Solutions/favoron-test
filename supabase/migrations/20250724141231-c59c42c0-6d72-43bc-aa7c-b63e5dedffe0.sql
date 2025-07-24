-- El email ya existe en la tabla profiles, pero vamos a asegurarnos de que el trigger lo actualice correctamente

-- Actualizar el trigger para asegurar que el email se copie correctamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert profile with all user data including email
  INSERT INTO public.profiles (id, first_name, last_name, phone_number, email, username)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name', 
    NEW.raw_user_meta_data ->> 'phone_number',
    NEW.email,  -- Asegurar que el email se copie
    NEW.raw_user_meta_data ->> 'username'
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Actualizar los perfiles existentes que no tienen email
UPDATE public.profiles 
SET email = (
  SELECT email 
  FROM auth.users 
  WHERE auth.users.id = profiles.id
)
WHERE email IS NULL;

-- Crear trigger para mantener el email actualizado
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Actualizar el email en profiles cuando cambie en auth.users
  UPDATE public.profiles 
  SET email = NEW.email
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Crear el trigger para sincronizar email
DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;
CREATE TRIGGER sync_user_email_trigger
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_email();