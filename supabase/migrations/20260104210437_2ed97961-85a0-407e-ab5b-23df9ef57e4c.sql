UPDATE packages
SET quote = jsonb_set(
  jsonb_set(
    quote,
    '{serviceFee}',
    '30.40'
  ),
  '{totalPrice}',
  '106.40'
)
WHERE id = '2f19bf78-8658-480c-a79f-66f553d86df0';