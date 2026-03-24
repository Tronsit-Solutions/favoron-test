CREATE POLICY "Authenticated users can read active boost codes"
ON public.boost_codes
FOR SELECT
TO authenticated
USING (is_active = true);