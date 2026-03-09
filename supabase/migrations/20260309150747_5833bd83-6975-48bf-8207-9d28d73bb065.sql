-- Make product-receipts bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'product-receipts';

-- Drop old permissive SELECT policy
DROP POLICY IF EXISTS "Product receipts are publicly accessible" ON storage.objects;

-- Create restricted SELECT policy: package owners, assigned travelers, and admins
CREATE POLICY "Restricted access to product receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'product-receipts' AND (
    -- Package owner (files stored as packageId/filename)
    EXISTS (
      SELECT 1 FROM public.packages p
      WHERE p.user_id = auth.uid()
      AND p.id::text = (storage.foldername(name))[1]
    )
    OR
    -- Assigned traveler
    EXISTS (
      SELECT 1 FROM public.packages p
      JOIN public.trips t ON t.id = p.matched_trip_id
      WHERE t.user_id = auth.uid()
      AND p.id::text = (storage.foldername(name))[1]
    )
    OR
    -- Admin access
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);