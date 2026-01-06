-- Corregir el service fee del Libro Paperback (de 40% a 50%)
UPDATE packages
SET quote = jsonb_set(
  jsonb_set(
    quote,
    '{serviceFee}',
    '35'::jsonb
  ),
  '{totalPrice}',
  '105'::jsonb
)
WHERE id = '9f02f06d-8b45-41e6-bcf8-1c210a31d9ec';