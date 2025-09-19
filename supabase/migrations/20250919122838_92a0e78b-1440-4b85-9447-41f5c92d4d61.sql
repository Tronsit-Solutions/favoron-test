-- Backfill existing payment_orders with payment-receipts/ prefix
UPDATE payment_orders
SET receipt_url = 'payment-receipts/' || receipt_url
WHERE receipt_url IS NOT NULL
  AND receipt_url NOT LIKE 'http%'
  AND receipt_url NOT LIKE '%/%';

-- Backfill existing trip_payment_accumulator with payment-receipts/ prefix  
UPDATE trip_payment_accumulator
SET payment_receipt_url = 'payment-receipts/' || payment_receipt_url
WHERE payment_receipt_url IS NOT NULL
  AND payment_receipt_url NOT LIKE 'http%'
  AND payment_receipt_url NOT LIKE '%/%';