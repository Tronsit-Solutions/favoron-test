-- Fix admin_assigned_tip from 200 to 275 on package and its active assignments
UPDATE packages 
SET admin_assigned_tip = 275, updated_at = now()
WHERE id = 'd6d157cd-0270-4e2f-a463-1587025a4a6c';

UPDATE package_assignments 
SET admin_assigned_tip = 275, updated_at = now()
WHERE package_id = 'd6d157cd-0270-4e2f-a463-1587025a4a6c'
  AND status IN ('bid_pending', 'bid_submitted');