-- Critical Security Fix: Lock down storage buckets and add RLS policies

-- 1. Make storage buckets private (they were public, exposing sensitive documents)
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('purchase-confirmations', 'payment-receipts', 'tracking-documents');

-- 2. Create comprehensive RLS policies for storage.objects to control access to sensitive documents

-- Policy: Users can view their own package documents
CREATE POLICY "Users can view their own package documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('purchase-confirmations', 'payment-receipts', 'tracking-documents')
  AND (
    -- Document belongs to user's package (extract package_id from path)
    EXISTS (
      SELECT 1 FROM public.packages p 
      WHERE p.id::text = (string_to_array(name, '/'))[1]
      AND p.user_id = auth.uid()
    )
    OR
    -- Document belongs to user's assigned trip package  
    EXISTS (
      SELECT 1 FROM public.packages p
      JOIN public.trips t ON t.id = p.matched_trip_id
      WHERE p.id::text = (string_to_array(name, '/'))[1]
      AND t.user_id = auth.uid()
    )
    OR
    -- Admin access
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
);

-- Policy: Users can upload documents for their own packages
CREATE POLICY "Users can upload package documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('purchase-confirmations', 'payment-receipts', 'tracking-documents')
  AND (
    -- Document belongs to user's package
    EXISTS (
      SELECT 1 FROM public.packages p 
      WHERE p.id::text = (string_to_array(name, '/'))[1]
      AND p.user_id = auth.uid()
    )
    OR
    -- Document belongs to user's assigned trip package
    EXISTS (
      SELECT 1 FROM public.packages p
      JOIN public.trips t ON t.id = p.matched_trip_id
      WHERE p.id::text = (string_to_array(name, '/'))[1]
      AND t.user_id = auth.uid()
    )
    OR
    -- Admin access
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
);

-- Policy: Users can update their own package documents
CREATE POLICY "Users can update package documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('purchase-confirmations', 'payment-receipts', 'tracking-documents')
  AND (
    EXISTS (
      SELECT 1 FROM public.packages p 
      WHERE p.id::text = (string_to_array(name, '/'))[1]
      AND p.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.packages p
      JOIN public.trips t ON t.id = p.matched_trip_id
      WHERE p.id::text = (string_to_array(name, '/'))[1]
      AND t.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
);

-- Policy: Users can delete their own package documents
CREATE POLICY "Users can delete package documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('purchase-confirmations', 'payment-receipts', 'tracking-documents')
  AND (
    EXISTS (
      SELECT 1 FROM public.packages p 
      WHERE p.id::text = (string_to_array(name, '/'))[1]
      AND p.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.packages p
      JOIN public.trips t ON t.id = p.matched_trip_id
      WHERE p.id::text = (string_to_array(name, '/'))[1]
      AND t.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
);

-- 3. Create missing storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('purchase-confirmations', 'purchase-confirmations', false, 5242880, ARRAY['image/*', 'application/pdf']::text[]),
  ('payment-receipts', 'payment-receipts', false, 5242880, ARRAY['image/*', 'application/pdf']::text[]),
  ('tracking-documents', 'tracking-documents', false, 5242880, ARRAY['image/*', 'application/pdf']::text[])
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/*', 'application/pdf']::text[];