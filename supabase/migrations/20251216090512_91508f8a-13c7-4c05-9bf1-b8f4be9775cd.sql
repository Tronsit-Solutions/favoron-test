-- Fix Alejandra's payment order historical_packages to include all 3 packages
UPDATE payment_orders
SET historical_packages = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'package_id', p.id,
      'item_description', p.item_description,
      'status', p.status,
      'quote', p.quote,
      'products_data', p.products_data
    )
  )
  FROM packages p
  WHERE p.matched_trip_id = 'd3383776-7bb7-4f06-8e17-d91f61bddf0f'
    AND p.status IN ('delivered_to_office', 'completed', 'received_by_traveler', 'ready_for_pickup', 'ready_for_delivery', 'out_for_delivery')
    AND p.quote IS NOT NULL
),
updated_at = now()
WHERE trip_id = 'd3383776-7bb7-4f06-8e17-d91f61bddf0f';