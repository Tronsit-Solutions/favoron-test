CREATE POLICY "Travelers can view packages they are assigned to"
ON public.packages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM package_assignments pa
    JOIN trips t ON t.id = pa.trip_id
    WHERE pa.package_id = packages.id
      AND t.user_id = auth.uid()
      AND pa.status NOT IN ('rejected', 'expired', 'cancelled')
  )
);