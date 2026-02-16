
-- Fix admin_assigned_tip for package 106aac44 (exclude cancelled Makeup Amarillo Q15)
UPDATE packages 
SET admin_assigned_tip = 75, updated_at = now()
WHERE id = '106aac44-79e5-42cd-a2c5-267cdfa19074';

-- Fix trip payment accumulator (520 - 15 = 505)
UPDATE trip_payment_accumulator 
SET accumulated_amount = 505, updated_at = now()
WHERE id = '8f058831-06fe-448b-b0ed-992efb011fc1';

-- Fix payment order amount (520 - 15 = 505)
UPDATE payment_orders 
SET amount = 505, updated_at = now()
WHERE id = '88ed8ffe-d75e-4924-a33c-342cc3b64640';
