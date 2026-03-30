-- Drop the overly permissive blanket policy
DROP POLICY IF EXISTS "Permission users can view profiles" ON public.profiles;

-- Replace with a scoped policy that requires the 'users' permission
CREATE POLICY "Permission users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_permission(auth.uid(), 'users'::text)
);