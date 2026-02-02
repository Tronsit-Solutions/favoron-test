-- Drop the existing constraint
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_delivery_method_check;

-- Add updated constraint with new return methods
ALTER TABLE packages ADD CONSTRAINT packages_delivery_method_check 
CHECK (delivery_method = ANY (ARRAY['pickup', 'delivery', 'return_dropoff', 'return_pickup']));