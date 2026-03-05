-- Allow admins to insert into discount_code_usage
CREATE POLICY "Admins can insert discount_code_usage"
ON public.discount_code_usage
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::user_role
  )
);