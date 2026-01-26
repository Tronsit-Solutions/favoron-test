-- Secure Storage Buckets: Make private and create proper RLS policies
-- This migration secures quote-payment-receipts, tip-payment-receipts, and traveler-confirmations

-- 1. Make buckets private
UPDATE storage.buckets SET public = false WHERE id = 'quote-payment-receipts';
UPDATE storage.buckets SET public = false WHERE id = 'tip-payment-receipts';
UPDATE storage.buckets SET public = false WHERE id = 'traveler-confirmations';

-- 2. Drop public read policies
DROP POLICY IF EXISTS "Public read quote payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public read tip payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public read traveler confirmations" ON storage.objects;

-- 3. Create restricted SELECT for quote-payment-receipts (owner + admin)
CREATE POLICY "Owner or admin can read quote payment receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'quote-payment-receipts'
  AND (
    has_role(auth.uid(), 'admin')
    OR split_part(name, '/', 1)::uuid = auth.uid()
  )
);

-- 4. Create restricted SELECT for tip-payment-receipts (traveler + admin)
CREATE POLICY "Traveler or admin can read tip payment receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tip-payment-receipts'
  AND (
    has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM payment_orders po
      WHERE po.traveler_id = auth.uid()
      AND (
        po.receipt_url = name
        OR po.receipt_url = 'payment-receipts/' || name
      )
    )
  )
);