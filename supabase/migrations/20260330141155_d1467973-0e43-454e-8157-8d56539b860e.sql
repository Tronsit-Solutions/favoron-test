-- Remove the dangerous public read policy
DROP POLICY IF EXISTS "Public read payment receipts" ON storage.objects;

-- Replace the existing user policy with a proper package-ownership check
DROP POLICY IF EXISTS "Users can view their own payment receipts" ON storage.objects;
CREATE POLICY "Users can view their own payment receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-receipts'
  AND EXISTS (
    SELECT 1 FROM packages p
    WHERE p.user_id = auth.uid()
      AND p.payment_receipt->>'filePath' = name
  )
);

-- Travelers can view payment receipts for packages matched to their trips
DROP POLICY IF EXISTS "Travelers can view matched package payment receipts" ON storage.objects;
CREATE POLICY "Travelers can view matched package payment receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-receipts'
  AND EXISTS (
    SELECT 1 FROM packages p
    JOIN trips t ON t.id = p.matched_trip_id
    WHERE t.user_id = auth.uid()
      AND p.payment_receipt->>'filePath' = name
  )
);

-- Operations staff can view all payment receipts
DROP POLICY IF EXISTS "Operations staff can view payment receipts" ON storage.objects;
CREATE POLICY "Operations staff can view payment receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-receipts'
  AND has_operations_role(auth.uid())
);