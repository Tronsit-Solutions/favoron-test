-- Insertar orden de pago para Leslie Lopez
INSERT INTO payment_orders (
  trip_id,
  traveler_id,
  amount,
  status,
  bank_name,
  bank_account_number,
  bank_account_holder,
  bank_account_type,
  payment_type
) VALUES (
  '8d9f7d8d-d948-4152-9540-6a86939b3f11',
  'c6eca445-a4f4-4e8f-95d7-8d4f07971eb8',
  290,
  'pending',
  'BI',
  '0180044669',
  'Leslie Lopez',
  'monetaria',
  'trip_payment'
);

-- Marcar el acumulador como con orden creada
UPDATE trip_payment_accumulator 
SET payment_order_created = true, updated_at = now()
WHERE id = 'bc4bf1a4-893c-48da-a53a-dd7576aa0375';