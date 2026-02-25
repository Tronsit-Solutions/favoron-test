
-- 1. Clear incident_flag on fragrances package
UPDATE packages 
SET incident_flag = false, incident_status = 'resolved'
WHERE id = '1bbf137e-e393-455d-872a-2e3495942e9b';

-- 2. Recalculate trip payment accumulator (3→4 packages, Q240→Q348)
UPDATE trip_payment_accumulator 
SET accumulated_amount = 348,
    delivered_packages_count = 4,
    total_packages_count = 4,
    all_packages_delivered = true,
    updated_at = now()
WHERE trip_id = 'a083cd4b-ecd5-4d35-af6e-58be4852c975';

-- 3. Update pending payment order amount
UPDATE payment_orders 
SET amount = 348, updated_at = now()
WHERE trip_id = 'a083cd4b-ecd5-4d35-af6e-58be4852c975' 
AND status = 'pending';
