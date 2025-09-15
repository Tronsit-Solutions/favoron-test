-- Fix incomplete payment receipt URLs in trip_payment_accumulator
-- Add Supabase Storage prefix to URLs that only contain filenames

UPDATE trip_payment_accumulator 
SET payment_receipt_url = 'https://dfhoduirmqbarjnspbdh.supabase.co/storage/v1/object/public/payment-receipts/' || payment_receipt_url,
    updated_at = NOW()
WHERE payment_receipt_url IS NOT NULL 
  AND payment_receipt_url NOT LIKE 'https://%'
  AND payment_receipt_url != '';

-- Log the number of records updated
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % payment receipt URLs with complete Supabase Storage URLs', updated_count;
END $$;