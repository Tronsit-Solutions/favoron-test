-- Add delivery_method column to packages table to track pickup vs delivery preference
ALTER TABLE packages ADD COLUMN delivery_method TEXT DEFAULT 'pickup' CHECK (delivery_method IN ('pickup', 'delivery'));

-- Update existing packages to have pickup as default (safest assumption)
UPDATE packages SET delivery_method = 'pickup' WHERE delivery_method IS NULL;