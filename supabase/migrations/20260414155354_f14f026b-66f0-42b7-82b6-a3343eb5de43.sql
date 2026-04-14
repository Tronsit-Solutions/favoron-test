
-- Step 1: Cancel all existing assignments for this package
UPDATE package_assignments 
SET status = 'bid_cancelled', updated_at = now()
WHERE package_id = 'fd3946ce-efec-44f0-94da-3e87502246d8'
AND status NOT IN ('bid_cancelled', 'bid_lost', 'bid_expired');

-- Step 2: Clean traveler info from the package
UPDATE packages 
SET matched_trip_id = NULL,
    quote = NULL,
    traveler_address = NULL,
    matched_trip_dates = NULL,
    traveler_confirmation = NULL,
    traveler_rejection = NULL,
    traveler_dismissal = NULL,
    traveler_dismissed_at = NULL,
    quote_expires_at = NULL,
    matched_assignment_expires_at = NULL,
    status = 'approved',
    updated_at = now()
WHERE id = 'fd3946ce-efec-44f0-94da-3e87502246d8';

-- Step 3: Create new assignment for Anika's May trip (cc7250a8)
INSERT INTO package_assignments (package_id, trip_id, status, admin_assigned_tip, traveler_address, matched_trip_dates)
SELECT 
  'fd3946ce-efec-44f0-94da-3e87502246d8',
  'cc7250a8-e27f-4cfb-8f7f-0856042025be',
  'bid_pending',
  110,
  t.package_receiving_address,
  jsonb_build_object('arrival_date', t.arrival_date, 'delivery_date', t.delivery_date)
FROM trips t WHERE t.id = 'cc7250a8-e27f-4cfb-8f7f-0856042025be';

-- Step 4: Update package status to matched
UPDATE packages 
SET status = 'matched',
    updated_at = now()
WHERE id = 'fd3946ce-efec-44f0-94da-3e87502246d8';
