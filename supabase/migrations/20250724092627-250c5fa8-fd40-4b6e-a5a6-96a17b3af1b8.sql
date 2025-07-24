-- Crear el trigger que falta para la función handle_new_user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Poblar los emails faltantes para usuarios existentes
UPDATE public.profiles 
SET email = auth.users.email
FROM auth.users 
WHERE profiles.id = auth.users.id 
  AND (profiles.email IS NULL OR profiles.email = '');