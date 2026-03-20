
-- 1. Create custom_roles table
CREATE TABLE public.custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create role_permissions table
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  UNIQUE(role_id, permission_key)
);

-- 3. Create user_custom_roles table
CREATE TABLE public.user_custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_role_id uuid NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, custom_role_id)
);

-- 4. Enable RLS
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_roles ENABLE ROW LEVEL SECURITY;

-- 5. RLS for custom_roles: admin full access, authenticated read
CREATE POLICY "Admins can manage custom_roles" ON public.custom_roles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Authenticated can read custom_roles" ON public.custom_roles
  FOR SELECT TO authenticated
  USING (true);

-- 6. RLS for role_permissions: admin full access, authenticated read
CREATE POLICY "Admins can manage role_permissions" ON public.role_permissions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Authenticated can read role_permissions" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (true);

-- 7. RLS for user_custom_roles: admin full access, users read own
CREATE POLICY "Admins can manage user_custom_roles" ON public.user_custom_roles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Users can read own custom roles" ON public.user_custom_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 8. Create has_permission function
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admin always has all permissions
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'admin'
    )
    OR
    -- Check custom role permissions
    EXISTS (
      SELECT 1 
      FROM public.user_custom_roles ucr
      JOIN public.role_permissions rp ON rp.role_id = ucr.custom_role_id
      WHERE ucr.user_id = _user_id AND rp.permission_key = _permission
    )
$$;
