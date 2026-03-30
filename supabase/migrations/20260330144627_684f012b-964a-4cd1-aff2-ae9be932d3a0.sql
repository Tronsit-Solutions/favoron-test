UPDATE packages SET
  products_data = '[
    {"itemDescription":"Cuchilla de corte para plotter casero ","estimatedPrice":"12.99","itemLink":"https://a.co/d/0b1cyioo","quantity":"1","adminAssignedTip":25,"requestType":"online","additionalNotes":null},
    {"itemDescription":"Par de cuchillas corte plotter casero","estimatedPrice":"17.45","itemLink":"https://a.co/d/037284q3","quantity":"1","adminAssignedTip":25,"requestType":"online","additionalNotes":null},
    {"itemDescription":"Brother ScanNCut DX Mat CADXMATSTD12, 12x12 Standard Tack Adhesive","estimatedPrice":"25.99","itemLink":"https://a.co/d/05WoPEqc","quantity":"1","adminAssignedTip":25,"requestType":"online","additionalNotes":null}
  ]'::jsonb,
  admin_assigned_tip = 75,
  quote = jsonb_build_object(
    'price', '75.00',
    'serviceFee', '37.50',
    'totalPrice', '112.50',
    'manually_edited', true,
    'edited_at', now()::text
  ),
  admin_actions_log = COALESCE(admin_actions_log, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
    'action', 'product_added_and_tips_updated',
    'timestamp', now()::text,
    'details', jsonb_build_object(
      'added_product', 'Brother ScanNCut DX Mat CADXMATSTD12',
      'previous_tip', '50.00',
      'new_tip', '75.00',
      'new_service_fee', '37.50',
      'new_total', '112.50'
    )
  )),
  updated_at = now()
WHERE id = 'f502267e-f51c-460d-b6ed-e67eaad951fb';

-- Sync to active package_assignments
UPDATE package_assignments SET
  products_data = '[
    {"itemDescription":"Cuchilla de corte para plotter casero ","estimatedPrice":"12.99","itemLink":"https://a.co/d/0b1cyioo","quantity":"1","adminAssignedTip":25,"requestType":"online","additionalNotes":null},
    {"itemDescription":"Par de cuchillas corte plotter casero","estimatedPrice":"17.45","itemLink":"https://a.co/d/037284q3","quantity":"1","adminAssignedTip":25,"requestType":"online","additionalNotes":null},
    {"itemDescription":"Brother ScanNCut DX Mat CADXMATSTD12, 12x12 Standard Tack Adhesive","estimatedPrice":"25.99","itemLink":"https://a.co/d/05WoPEqc","quantity":"1","adminAssignedTip":25,"requestType":"online","additionalNotes":null}
  ]'::jsonb,
  admin_assigned_tip = 75,
  updated_at = now()
WHERE package_id = 'f502267e-f51c-460d-b6ed-e67eaad951fb'
  AND status IN ('bid_pending', 'bid_submitted');