-- Drop 6 legacy/conflicting storage policies from payment-receipts bucket
DROP POLICY IF EXISTS "Users can upload their own payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Shoppers can upload purchase confirmations" ON storage.objects;
DROP POLICY IF EXISTS "Shoppers and admins can update purchase confirmations" ON storage.objects;
DROP POLICY IF EXISTS "Restricted access to purchase confirmations" ON storage.objects;