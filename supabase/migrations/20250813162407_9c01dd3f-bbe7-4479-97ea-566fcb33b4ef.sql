-- Create RLS policies for payment-receipts bucket access control
-- Only allow admin, package owner (shopper), and assigned traveler to view purchase confirmations

-- Policy for viewing purchase confirmation files
CREATE POLICY "Restricted access to purchase confirmations" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'payment-receipts' AND (
    -- Admin access
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
    OR
    -- Package owner (shopper) access  
    EXISTS (
      SELECT 1 FROM public.packages p
      WHERE p.purchase_confirmation->>'filePath' = storage.objects.name
        AND p.user_id = auth.uid()
    )
    OR
    -- Assigned traveler access
    EXISTS (
      SELECT 1 FROM public.packages p
      JOIN public.trips t ON t.id = p.matched_trip_id
      WHERE p.purchase_confirmation->>'filePath' = storage.objects.name
        AND t.user_id = auth.uid()
    )
  )
);

-- Policy for uploading purchase confirmation files (shoppers only)
CREATE POLICY "Shoppers can upload purchase confirmations" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'payment-receipts' AND
  EXISTS (
    SELECT 1 FROM public.packages p
    WHERE p.user_id = auth.uid()
  )
);

-- Policy for updating purchase confirmation files (shoppers and admins)
CREATE POLICY "Shoppers and admins can update purchase confirmations" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'payment-receipts' AND (
    -- Admin access
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
    OR
    -- Package owner access
    EXISTS (
      SELECT 1 FROM public.packages p
      WHERE p.purchase_confirmation->>'filePath' = storage.objects.name
        AND p.user_id = auth.uid()
    )
  )
);

-- Policy for deleting purchase confirmation files (admins only)
CREATE POLICY "Admins can delete purchase confirmations" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'payment-receipts' AND
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);