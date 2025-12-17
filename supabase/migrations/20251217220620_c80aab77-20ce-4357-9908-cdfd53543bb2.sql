-- Create storage bucket for product receipt photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-receipts', 'product-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to product-receipts bucket
CREATE POLICY "Authenticated users can upload product receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-receipts' 
  AND auth.role() = 'authenticated'
);

-- Allow public read access to product receipts
CREATE POLICY "Product receipts are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-receipts');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own product receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);