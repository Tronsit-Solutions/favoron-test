
CREATE POLICY "Admins can upload product photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-photos'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can update product photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-photos'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
