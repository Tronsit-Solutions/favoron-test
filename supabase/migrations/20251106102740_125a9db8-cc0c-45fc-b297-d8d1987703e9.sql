-- Fix restrictive RLS blocking SELECT on user_roles
-- Drop overly restrictive ALL policy and replace with command-specific ones
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Allow users to view their own role (already added previously)
-- Ensure admins can view all roles (already added previously)

-- Restrict mutations to admins only
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));