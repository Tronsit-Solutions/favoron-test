UPDATE packages
SET 
  quote = quote || '{"serviceFee": 30.40, "totalPrice": 106.40}'::jsonb,
  updated_at = NOW()
WHERE id = '2f19bf78-8658-480c-a79f-66f553d86df0';