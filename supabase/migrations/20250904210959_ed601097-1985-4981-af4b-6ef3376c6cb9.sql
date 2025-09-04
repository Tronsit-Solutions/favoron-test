
-- 1) Allow NULL phone_number in profiles
ALTER TABLE public.profiles
  ALTER COLUMN phone_number DROP NOT NULL;

-- 2) Create validation function to require phone number for certain actions
CREATE OR REPLACE FUNCTION public.ensure_user_has_phone_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- Block if missing or empty
  IF v_phone IS NULL THEN
    RAISE EXCEPTION 'Phone number is required to perform this action';
  END IF;

  RETURN NEW;
END;
$function$;

-- 3) Enforce phone requirement on trip creation
DROP TRIGGER IF EXISTS ensure_phone_before_insert_trips ON public.trips;
CREATE TRIGGER ensure_phone_before_insert_trips
  BEFORE INSERT ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_has_phone_number();

-- 4) Enforce phone requirement on package creation (orders)
DROP TRIGGER IF EXISTS ensure_phone_before_insert_packages ON public.packages;
CREATE TRIGGER ensure_phone_before_insert_packages
  BEFORE INSERT ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_has_phone_number();
