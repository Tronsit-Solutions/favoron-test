-- Fix packages stuck in pending_purchase with purchase_confirmation
-- Phase 1: Correct existing data
UPDATE packages
SET status = 'in_transit',
    updated_at = NOW()
WHERE purchase_confirmation IS NOT NULL
  AND tracking_info IS NOT NULL
  AND status = 'pending_purchase';

-- Phase 2: Create trigger to auto-transition to in_transit
CREATE OR REPLACE FUNCTION auto_transition_to_in_transit()
RETURNS TRIGGER AS $$
BEGIN
  -- If purchase_confirmation is added and package is in valid pre-transit state
  IF NEW.purchase_confirmation IS NOT NULL 
     AND OLD.purchase_confirmation IS NULL
     AND NEW.status IN ('pending_purchase', 'payment_confirmed', 'paid') THEN
    NEW.status := 'in_transit';
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS packages_auto_in_transit ON packages;
CREATE TRIGGER packages_auto_in_transit
  BEFORE UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION auto_transition_to_in_transit();