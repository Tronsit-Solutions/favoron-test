-- Ensure customer-photos bucket exists and is public
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'customer-photos'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('customer-photos', 'customer-photos', true);
  END IF;
END $$;

-- Public read access to customer photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Public can read customer photos'
  ) THEN
    CREATE POLICY "Public can read customer photos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'customer-photos');
  END IF;
END $$;

-- Admins can upload to customer-photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Admins can upload customer photos'
  ) THEN
    CREATE POLICY "Admins can upload customer photos"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'customer-photos' AND public.has_role(auth.uid(), 'admin')
    );
  END IF;
END $$;

-- Admins can update objects in customer-photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Admins can update customer photos'
  ) THEN
    CREATE POLICY "Admins can update customer photos"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'customer-photos' AND public.has_role(auth.uid(), 'admin')
    );
  END IF;
END $$;

-- Admins can delete objects in customer-photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Admins can delete customer photos'
  ) THEN
    CREATE POLICY "Admins can delete customer photos"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'customer-photos' AND public.has_role(auth.uid(), 'admin')
    );
  END IF;
END $$;