-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-receipts', 'payment-receipts', false);

-- Create policies for payment receipts bucket
-- Allow authenticated users to upload their own payment receipts
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

-- Allow admins to view all payment receipts
CREATE POLICY "Admins can view all payment receipts" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'payment-receipts' 
  AND has_role(auth.uid(), 'admin'::user_role)
);

-- Allow users to update their own payment receipts
CREATE POLICY "Users can update their own payment receipts" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'payment-receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own payment receipts
CREATE POLICY "Users can delete their own payment receipts" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'payment-receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);