-- Backfill admin_assigned_tip into products_data for single-product packages
-- This ensures consistency so travelers always see tips from products_data.adminAssignedTip

UPDATE packages 
SET products_data = jsonb_build_array(
  jsonb_build_object(
    'itemDescription', item_description,
    'estimatedPrice', COALESCE(estimated_price::text, '0'),
    'itemLink', item_link,
    'quantity', '1',
    'adminAssignedTip', admin_assigned_tip
  )
)
WHERE (
  -- Single product packages without products_data or with empty products_data
  (products_data IS NULL OR jsonb_array_length(products_data) = 0)
  -- That have an admin assigned tip
  AND admin_assigned_tip IS NOT NULL
  AND admin_assigned_tip > 0
);

-- Update existing products_data entries that might be missing adminAssignedTip field
UPDATE packages 
SET products_data = (
  SELECT jsonb_agg(
    CASE 
      WHEN (elem->>'adminAssignedTip') IS NULL 
      THEN elem || jsonb_build_object('adminAssignedTip', admin_assigned_tip)
      ELSE elem
    END
  )
  FROM jsonb_array_elements(products_data) AS elem
)
WHERE products_data IS NOT NULL 
  AND jsonb_array_length(products_data) = 1
  AND admin_assigned_tip IS NOT NULL
  AND admin_assigned_tip > 0
  AND (products_data->0->>'adminAssignedTip') IS NULL;