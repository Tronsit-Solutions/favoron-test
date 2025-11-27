-- Phase 2: Restore correct statuses for affected packages
-- These packages were incorrectly reverted to pending_purchase by the trigger bug

-- Package 1: 59f1bd9b (perfume) - has traveler_confirmation, should be received_by_traveler
UPDATE packages 
SET status = 'received_by_traveler', updated_at = NOW()
WHERE id = '59f1bd9b-8fdd-4e74-ac4a-cafe7fd2319f'
  AND status = 'pending_purchase'
  AND traveler_confirmation IS NOT NULL;

-- Package 2: 1ef2b099 (Calzetas) - has office_delivery.admin_confirmation, should be delivered_to_office  
UPDATE packages 
SET status = 'delivered_to_office', updated_at = NOW()
WHERE id = '1ef2b099-1e6e-4b64-b590-39a74814619f'
  AND status = 'pending_purchase'
  AND office_delivery->>'admin_confirmation' IS NOT NULL;

-- Package 3: 6b21ce1d (Perfume 125ml) - has purchase_confirmation, should be in_transit
UPDATE packages 
SET status = 'in_transit', updated_at = NOW()
WHERE id = '6b21ce1d-0c28-4b97-80f8-f095ce1dd612'
  AND status = 'pending_purchase'
  AND purchase_confirmation IS NOT NULL
  AND traveler_confirmation IS NULL;