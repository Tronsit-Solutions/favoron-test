-- Add support for multiple products in packages table
ALTER TABLE packages ADD COLUMN products_data jsonb DEFAULT NULL;

-- Update existing records to include product data in the new format
UPDATE packages 
SET products_data = jsonb_build_array(
  jsonb_build_object(
    'itemLink', item_link,
    'itemDescription', item_description,
    'estimatedPrice', estimated_price::text
  )
)
WHERE products_data IS NULL AND item_link IS NOT NULL;