-- Corregir el trip_payment_accumulator de Jose Rosales
UPDATE trip_payment_accumulator 
SET 
  accumulated_amount = 360,
  delivered_packages_count = 3,
  total_packages_count = 3,
  all_packages_delivered = true,
  updated_at = now()
WHERE trip_id = '0bc25a81-e5a0-4bd6-8ddb-63a018e3b5fe';

-- Crear orden de pago para Jose Rosales
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
  '0bc25a81-e5a0-4bd6-8ddb-63a018e3b5fe',
  'b347f99b-48e1-44f6-b6c3-9abf03718a1d',
  360,
  'pending',
  'Banco Industrial',
  '014-278268-9',
  'Jose Rosales',
  'monetaria',
  'trip_payment'
);

-- Marcar el acumulador como con orden creada
UPDATE trip_payment_accumulator 
SET payment_order_created = true, updated_at = now()
WHERE trip_id = '0bc25a81-e5a0-4bd6-8ddb-63a018e3b5fe';