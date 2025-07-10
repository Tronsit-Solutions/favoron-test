-- Allow travelers to view purchase confirmations for packages matched to their trips
CREATE POLICY "Travelers can view purchase confirmations for matched packages" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'payment-receipts' 
  AND (
    -- Get the package_id from the file path (first folder)
    (storage.foldername(name))[1] IN (
      SELECT packages.id::text
      FROM packages
      WHERE packages.matched_trip_id IN (
        SELECT trips.id
        FROM trips
        WHERE trips.user_id = auth.uid()
      )
    )
  )
);