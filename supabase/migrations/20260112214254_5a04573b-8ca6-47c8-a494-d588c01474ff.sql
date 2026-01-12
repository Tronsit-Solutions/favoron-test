
-- Delete the existing payment order for testing
DELETE FROM payment_orders 
WHERE id = '81521adf-6e38-4be3-97d2-3f1f342c190b';

-- Reset the trip payment accumulator to allow creating a new payment order
UPDATE trip_payment_accumulator 
SET payment_order_created = false
WHERE id = '60a13378-f622-455f-a746-98b5ebb64a07';
