-- Allow admins to view all profiles so admin views (e.g., trip lists) can show traveler names
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::user_role)
);
