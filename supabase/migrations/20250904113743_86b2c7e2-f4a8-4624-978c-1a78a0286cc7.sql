-- 1) Create SECURITY DEFINER trigger function to assign default 'user' role on new profiles
CREATE OR REPLACE FUNCTION public.assign_default_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the user already has any role, do nothing
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  -- Insert default 'user' role
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (NEW.id, 'user'::user_role, NEW.id);

  RETURN NEW;
END;
$$;

-- 2) Attach trigger to profiles (avoid touching auth schema)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_assign_default_user_role'
  ) THEN
    CREATE TRIGGER trg_assign_default_user_role
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_default_user_role();
  END IF;
END $$;

-- 3) Backfill: assign 'user' role to any existing user with no roles
INSERT INTO public.user_roles (user_id, role, assigned_by)
SELECT p.id, 'user'::user_role, NULL
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id
);

-- 4) Optional sanity notices
DO $$
DECLARE
  total_users integer;
  users_with_roles integer;
BEGIN
  SELECT COUNT(*) INTO total_users FROM public.profiles;
  SELECT COUNT(DISTINCT user_id) INTO users_with_roles FROM public.user_roles;
  RAISE NOTICE 'Users: %, Users with roles: %', total_users, users_with_roles;
END $$;