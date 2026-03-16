DROP POLICY IF EXISTS "Public can view consented traveler surveys" ON public.traveler_surveys;

CREATE POLICY "Authenticated can view consented traveler surveys"
ON public.traveler_surveys
FOR SELECT
TO authenticated
USING (consent_to_publish = true);