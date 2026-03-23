CREATE OR REPLACE FUNCTION public.has_operations_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_custom_roles ucr
    JOIN public.role_permissions rp ON rp.role_id = ucr.custom_role_id
    WHERE ucr.user_id = _user_id
      AND rp.permission_key = 'operations'
  )
$$;