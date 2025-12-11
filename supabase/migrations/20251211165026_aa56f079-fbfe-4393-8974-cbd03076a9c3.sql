-- Fix inconsistent package state where all products are confirmed but status is still in_transit
UPDATE packages 
SET 
  status = 'received_by_traveler',
  traveler_confirmation = jsonb_build_object(
    'confirmedAt', now(),
    'allProductsConfirmed', true,
    'autoReconciled', true
  ),
  updated_at = now()
WHERE id = '1a345449-15c0-48e7-83cb-0a8ea408bf93'
  AND status = 'in_transit';