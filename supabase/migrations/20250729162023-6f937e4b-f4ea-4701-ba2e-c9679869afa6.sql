-- Actualizar la función handle_new_user para manejar country_code separado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Insert profile with all user data including separated country_code and phone_number
  INSERT INTO public.profiles (id, first_name, last_name, country_code, phone_number, email, username)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name', 
    NEW.raw_user_meta_data ->> 'country_code',
    NEW.raw_user_meta_data ->> 'phone_number',
    NEW.email,
    NEW.raw_user_meta_data ->> 'username'
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;