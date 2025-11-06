-- Fix recursive RLS policy on user_roles
-- Users should be able to read their own role without admin check

DROP POLICY IF EXISTS "Users can view roles (self or admin)" ON public.user_roles;

-- Allow users to view their own roles (no admin check to avoid recursion)
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow admins to view all roles (uses has_role function which is security definer)
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  has_role(auth.uid(), 'admin'::user_role)
);