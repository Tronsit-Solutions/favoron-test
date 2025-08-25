-- Create public bucket for payment receipts if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'payment-receipts'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('payment-receipts', 'payment-receipts', true);
  END IF;
END $$;

-- Policies for storage.objects scoped to the payment-receipts bucket
-- Public read (via signed or public URLs). This enables listing via API too if needed.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND polname = 'Public read payment receipts'
  ) THEN
    CREATE POLICY "Public read payment receipts"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'payment-receipts');
  END IF;
END $$;

-- Admins can insert/upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND polname = 'Admins can insert payment receipts'
  ) THEN
    CREATE POLICY "Admins can insert payment receipts"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'payment-receipts' AND public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Admins can update metadata/replace files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND polname = 'Admins can update payment receipts'
  ) THEN
    CREATE POLICY "Admins can update payment receipts"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'payment-receipts' AND public.has_role(auth.uid(), 'admin'))
    WITH CHECK (bucket_id = 'payment-receipts' AND public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Admins can delete receipts if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND polname = 'Admins can delete payment receipts'
  ) THEN
    CREATE POLICY "Admins can delete payment receipts"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'payment-receipts' AND public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;