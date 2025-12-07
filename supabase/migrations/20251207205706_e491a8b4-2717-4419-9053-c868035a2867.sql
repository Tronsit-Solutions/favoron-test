-- Migrate any existing packages with payment_confirmed status to pending_purchase
UPDATE public.packages 
SET status = 'pending_purchase', updated_at = NOW()
WHERE status = 'payment_confirmed';

-- Log how many were updated
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % packages from payment_confirmed to pending_purchase', updated_count;
END $$;