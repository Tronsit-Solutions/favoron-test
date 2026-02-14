
-- Insertar orden de cobro para Nicte Portillo
INSERT INTO payment_orders (traveler_id, trip_id, amount, bank_name, bank_account_holder, bank_account_number, bank_account_type, status)
VALUES (
  '13ce954f-0d26-4b83-8411-8c52efb5a64a',
  '662b8f5b-145d-4de4-bd75-2bd640a65b41',
  280,
  'Banco Industrial',
  'PORTILLO ESCOBAR NICTE ALEXANDRA',
  '0142077360',
  'monetaria',
  'pending'
);

-- Marcar el acumulador como payment_order_created
UPDATE trip_payment_accumulator
SET payment_order_created = true, updated_at = now()
WHERE trip_id = '662b8f5b-145d-4de4-bd75-2bd640a65b41'
  AND traveler_id = '13ce954f-0d26-4b83-8411-8c52efb5a64a';
