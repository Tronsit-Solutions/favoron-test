-- Create storage policies for payment receipts bucket
-- Allow users to upload their own payment receipts
CREATE POLICY "Users can upload their own payment receipts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'payment-receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own payment receipts
CREATE POLICY "Users can view their own payment receipts" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'payment-receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to manage all payment receipts
CREATE POLICY "Admins can manage all payment receipts" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'payment-receipts' 
  AND has_role(auth.uid(), 'admin'::user_role)
);