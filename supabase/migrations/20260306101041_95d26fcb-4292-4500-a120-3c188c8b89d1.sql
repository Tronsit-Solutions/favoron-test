-- Allow admins to delete referrals
CREATE POLICY "Admins can delete referrals"
ON public.referrals
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

-- Allow admins to insert referrals
CREATE POLICY "Admins can insert referrals"
ON public.referrals
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Allow admins to update referrals
CREATE POLICY "Admins can update referrals"
ON public.referrals
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));