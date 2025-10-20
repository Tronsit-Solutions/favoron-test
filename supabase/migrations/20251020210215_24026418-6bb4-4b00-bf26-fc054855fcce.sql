-- Update all packages with status 'purchased' to 'in_transit'
-- This is a one-time migration to fix the incorrect status
UPDATE packages
SET status = 'in_transit',
    updated_at = NOW()
WHERE status = 'purchased';

-- Log the number of affected rows
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Updated % packages from purchased to in_transit', affected_count;
END $$;