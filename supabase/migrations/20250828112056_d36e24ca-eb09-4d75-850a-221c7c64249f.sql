-- Fix recursion risk in user_roles SELECT policy by using has_role()
DROP POLICY IF EXISTS "Users can view only their own roles" ON public.user_roles;

CREATE POLICY "Users can view roles (self or admin)"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::user_role)
);