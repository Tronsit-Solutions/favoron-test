
-- 1) Bucket: quote-payment-receipts (comprobante de pago de la cotización, shopper)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'quote-payment-receipts') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('quote-payment-receipts', 'quote-payment-receipts', true);
  END IF;
END $$;

-- Public read (ver/descargar)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Public read quote payment receipts'
  ) THEN
    CREATE POLICY "Public read quote payment receipts"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'quote-payment-receipts');
  END IF;
END $$;

-- Shopper (dueño) o Admin pueden subir a su propia carpeta: {user_id}/...
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Shopper/Admin can insert quote payment receipts'
  ) THEN
    CREATE POLICY "Shopper/Admin can insert quote payment receipts"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'quote-payment-receipts'
      AND (
        public.has_role(auth.uid(), 'admin')
        OR split_part(name, '/', 1)::uuid = auth.uid()
      )
    );
  END IF;
END $$;

-- UPDATE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Shopper/Admin can update quote payment receipts'
  ) THEN
    CREATE POLICY "Shopper/Admin can update quote payment receipts"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'quote-payment-receipts'
      AND (
        public.has_role(auth.uid(), 'admin')
        OR split_part(name, '/', 1)::uuid = auth.uid()
      )
    )
    WITH CHECK (
      bucket_id = 'quote-payment-receipts'
      AND (
        public.has_role(auth.uid(), 'admin')
        OR split_part(name, '/', 1)::uuid = auth.uid()
      )
    );
  END IF;
END $$;

-- DELETE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Shopper/Admin can delete quote payment receipts'
  ) THEN
    CREATE POLICY "Shopper/Admin can delete quote payment receipts"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'quote-payment-receipts'
      AND (
        public.has_role(auth.uid(), 'admin')
        OR split_part(name, '/', 1)::uuid = auth.uid()
      )
    );
  END IF;
END $$;


-- 2) Bucket: purchase-confirmations (confirmación de compra del producto, shopper)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'purchase-confirmations') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('purchase-confirmations', 'purchase-confirmations', true);
  END IF;
END $$;

-- Public read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Public read purchase confirmations'
  ) THEN
    CREATE POLICY "Public read purchase confirmations"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'purchase-confirmations');
  END IF;
END $$;

-- Shopper (dueño) o Admin pueden subir a su carpeta: {user_id}/...
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Shopper/Admin can insert purchase confirmations'
  ) THEN
    CREATE POLICY "Shopper/Admin can insert purchase confirmations"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'purchase-confirmations'
      AND (
        public.has_role(auth.uid(), 'admin')
        OR split_part(name, '/', 1)::uuid = auth.uid()
      )
    );
  END IF;
END $$;

-- UPDATE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Shopper/Admin can update purchase confirmations'
  ) THEN
    CREATE POLICY "Shopper/Admin can update purchase confirmations"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'purchase-confirmations'
      AND (
        public.has_role(auth.uid(), 'admin')
        OR split_part(name, '/', 1)::uuid = auth.uid()
      )
    )
    WITH CHECK (
      bucket_id = 'purchase-confirmations'
      AND (
        public.has_role(auth.uid(), 'admin')
        OR split_part(name, '/', 1)::uuid = auth.uid()
      )
    );
  END IF;
END $$;

-- DELETE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Shopper/Admin can delete purchase confirmations'
  ) THEN
    CREATE POLICY "Shopper/Admin can delete purchase confirmations"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'purchase-confirmations'
      AND (
        public.has_role(auth.uid(), 'admin')
        OR split_part(name, '/', 1)::uuid = auth.uid()
      )
    );
  END IF;
END $$;


-- 3) Bucket: traveler-confirmations (comprobante/foto que sube el viajero)
-- Lo mantenemos (nombre claro) pero aseguramos su existencia y políticas.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'traveler-confirmations') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('traveler-confirmations', 'traveler-confirmations', true);
  END IF;
END $$;

-- Public read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Public read traveler confirmations'
  ) THEN
    CREATE POLICY "Public read traveler confirmations"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'traveler-confirmations');
  END IF;
END $$;

-- Viajero (dueño) o Admin pueden subir a su carpeta: {user_id}/...
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Traveler/Admin can insert traveler confirmations'
  ) THEN
    CREATE POLICY "Traveler/Admin can insert traveler confirmations"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'traveler-confirmations'
      AND (
        public.has_role(auth.uid(), 'admin')
        OR split_part(name, '/', 1)::uuid = auth.uid()
      )
    );
  END IF;
END $$;

-- UPDATE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Traveler/Admin can update traveler confirmations'
  ) THEN
    CREATE POLICY "Traveler/Admin can update traveler confirmations"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'traveler-confirmations'
      AND (
        public.has_role(auth.uid(), 'admin')
        OR split_part(name, '/', 1)::uuid = auth.uid()
      )
    )
    WITH CHECK (
      bucket_id = 'traveler-confirmations'
      AND (
        public.has_role(auth.uid(), 'admin')
        OR split_part(name, '/', 1)::uuid = auth.uid()
      )
    );
  END IF;
END $$;

-- DELETE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Traveler/Admin can delete traveler confirmations'
  ) THEN
    CREATE POLICY "Traveler/Admin can delete traveler confirmations"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'traveler-confirmations'
      AND (
        public.has_role(auth.uid(), 'admin')
        OR split_part(name, '/', 1)::uuid = auth.uid()
      )
    );
  END IF;
END $$;


-- 4) Bucket: tip-payment-receipts (comprobante de pago de propina al viajero, admin)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'tip-payment-receipts') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('tip-payment-receipts', 'tip-payment-receipts', true);
  END IF;
END $$;

-- Public read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Public read tip payment receipts'
  ) THEN
    CREATE POLICY "Public read tip payment receipts"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'tip-payment-receipts');
  END IF;
END $$;

-- Solo Admin puede insertar/actualizar/eliminar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Admins can insert tip payment receipts'
  ) THEN
    CREATE POLICY "Admins can insert tip payment receipts"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'tip-payment-receipts'
      AND public.has_role(auth.uid(), 'admin')
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Admins can update tip payment receipts'
  ) THEN
    CREATE POLICY "Admins can update tip payment receipts"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'tip-payment-receipts'
      AND public.has_role(auth.uid(), 'admin')
    )
    WITH CHECK (
      bucket_id = 'tip-payment-receipts'
      AND public.has_role(auth.uid(), 'admin')
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Admins can delete tip payment receipts'
  ) THEN
    CREATE POLICY "Admins can delete tip payment receipts"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'tip-payment-receipts'
      AND public.has_role(auth.uid(), 'admin')
    );
  END IF;
END $$;
