-- Corregir quote de María Paula - Tercer intento con UPDATE directo
UPDATE packages
SET 
  quote = jsonb_set(
    jsonb_set(quote, '{serviceFee}', '30.40'::jsonb),
    '{totalPrice}', 
    '106.40'::jsonb
  ),
  updated_at = NOW()
WHERE id = '2f19bf78-8658-480c-a79f-66f553d86df0'
  AND (quote->>'serviceFee')::numeric = 26.6;