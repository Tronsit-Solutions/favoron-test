-- Make departure_date nullable to stop requiring it
ALTER TABLE trips ALTER COLUMN departure_date DROP NOT NULL;

-- Add comment explaining the field is deprecated
COMMENT ON COLUMN trips.departure_date IS 'Deprecated field - no longer used in application flow. Kept for historical data only.';