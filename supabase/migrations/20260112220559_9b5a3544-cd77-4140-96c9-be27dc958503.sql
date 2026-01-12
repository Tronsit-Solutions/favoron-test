-- Crear órdenes de pago para viajeros con entregas completadas
INSERT INTO payment_orders (
  trip_id, 
  traveler_id, 
  amount, 
  bank_name, 
  bank_account_number, 
  bank_account_holder, 
  bank_account_type, 
  status,
  payment_type
) VALUES 
  -- Habibi Quiñonez
  ('16109ecc-4125-40f7-999c-25b3e2afcf67', '79ada723-dbb8-4032-9b54-d5d54e69b03a', 450, 'Bi', '8000028921', 'Habibi Quiñonez', 'monetaria', 'pending', 'trip_payment'),
  -- Alejandra Meda
  ('cfdacf4c-f455-452c-b318-2b7538181d82', 'c691f054-c6d4-45e2-8131-1698695b5237', 245, 'Banco Industrial', '1850044189', 'Alejandra Meda', 'monetaria', 'pending', 'trip_payment'),
  -- Tomas Quiñones
  ('f262737a-5eed-4552-bcdc-6e469c6cf52e', '62544144-cded-4da9-8d3b-1c0275021289', 200, 'BAM', '40-3008287-6', 'Tomas Quiñones Neuweiler', 'ahorros', 'pending', 'trip_payment');

-- Marcar los accumulators como procesados
UPDATE trip_payment_accumulator 
SET payment_order_created = true, updated_at = now()
WHERE trip_id IN (
  '16109ecc-4125-40f7-999c-25b3e2afcf67',
  'cfdacf4c-f455-452c-b318-2b7538181d82',
  'f262737a-5eed-4552-bcdc-6e469c6cf52e'
);