-- Recrear la función de validación de teléfono
CREATE OR REPLACE FUNCTION public.ensure_user_has_phone_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public 
AS $$
DECLARE
  v_phone text;
BEGIN
  -- Require authenticated user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Read the caller's phone number from profiles
  SELECT NULLIF(trim(phone_number), '')
    INTO v_phone
  FROM public.profiles
  WHERE id = auth.uid();

  -- Block if missing or empty (NO EXCEPTIONS FOR ANY ROLE)
  IF v_phone IS NULL THEN
    RAISE EXCEPTION 'Phone number is required to perform this action';
  END IF;

  RETURN NEW;
END;
$$;

-- Aplicar trigger a la tabla packages (sin excepciones)
CREATE TRIGGER check_phone_before_package_insert
  BEFORE INSERT ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_has_phone_number();

-- Aplicar trigger a la tabla trips (sin excepciones)
CREATE TRIGGER check_phone_before_trip_insert
  BEFORE INSERT ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_has_phone_number();