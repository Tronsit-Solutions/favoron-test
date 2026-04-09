UPDATE packages
SET matched_trip_id = NULL,
    traveler_address = NULL,
    matched_trip_dates = NULL,
    updated_at = now()
WHERE id = 'b6118b13-a65a-439f-9545-8bd0668ec846';