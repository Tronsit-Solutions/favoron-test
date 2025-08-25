-- Step 1: Create unique index to prevent multiple active payment orders per trip
CREATE UNIQUE INDEX idx_payment_orders_unique_active_per_trip 
ON payment_orders (traveler_id, trip_id) 
WHERE status IN ('pending', 'completed');