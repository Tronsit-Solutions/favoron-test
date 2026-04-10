
-- 1. Insert boost_code_usage for trip 0dff3d19 (Q400 -> boost Q24)
INSERT INTO public.boost_code_usage (boost_code_id, traveler_id, trip_id, boost_amount)
VALUES ('35582cad-c6fe-412d-9778-66839baf9a3e', '43867ab7-a3b1-4c50-a036-e656db9289b8', '0dff3d19-d762-4f80-895e-f16c93939bfe', 24.00);

-- 2. Insert boost_code_usage for trip bcd58f84 (Q240 -> boost Q14.40)
INSERT INTO public.boost_code_usage (boost_code_id, traveler_id, trip_id, boost_amount)
VALUES ('35582cad-c6fe-412d-9778-66839baf9a3e', '43867ab7-a3b1-4c50-a036-e656db9289b8', 'bcd58f84-e63d-4e39-a91f-45f97156af44', 14.40);

-- 3. Update trip_payment_accumulator boost_amount for trip 0dff3d19
UPDATE public.trip_payment_accumulator
SET boost_amount = 24.00, updated_at = now()
WHERE trip_id = '0dff3d19-d762-4f80-895e-f16c93939bfe'
  AND traveler_id = '43867ab7-a3b1-4c50-a036-e656db9289b8';

-- 4. Update trip_payment_accumulator boost_amount for trip bcd58f84
UPDATE public.trip_payment_accumulator
SET boost_amount = 14.40, updated_at = now()
WHERE trip_id = 'bcd58f84-e63d-4e39-a91f-45f97156af44'
  AND traveler_id = '43867ab7-a3b1-4c50-a036-e656db9289b8';

-- 5. Update payment_order amount for trip 0dff3d19 (Q400 + Q24 = Q424)
UPDATE public.payment_orders
SET amount = 424.00, updated_at = now()
WHERE id = 'cdde845e-73dd-4100-85a1-aaa5bc25e3ea';

-- 6. Update payment_order amount for trip bcd58f84 (Q240 + Q14.40 = Q254.40)
UPDATE public.payment_orders
SET amount = 254.40, updated_at = now()
WHERE id = '76b2f50a-d2a2-4464-90e3-1c5e60f3f40e';
