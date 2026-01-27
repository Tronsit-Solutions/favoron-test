-- Paso 1: Crear Trip Payment Accumulator para Daniela Ortiz-Miron
INSERT INTO trip_payment_accumulator (
  trip_id,
  traveler_id,
  accumulated_amount,
  delivered_packages_count,
  total_packages_count,
  all_packages_delivered,
  payment_order_created
) VALUES (
  '4fb91dad-1df0-4ea7-97b2-60fc8ac9d270',
  '3c364aa5-172d-4f60-a106-9935a752fc6e',
  100.00,
  1,
  1,
  true,
  true
);

-- Paso 2: Crear Payment Order pendiente
INSERT INTO payment_orders (
  trip_id,
  traveler_id,
  amount,
  bank_name,
  bank_account_holder,
  bank_account_number,
  bank_account_type,
  payment_type,
  status,
  historical_packages
) VALUES (
  '4fb91dad-1df0-4ea7-97b2-60fc8ac9d270',
  '3c364aa5-172d-4f60-a106-9935a752fc6e',
  100.00,
  'Banco Industrial',
  'Daniela Ortiz',
  '8090013015',
  'monetaria',
  'trip_payment',
  'pending',
  '[{"package_id": "d1b27084-a4b8-444f-a39d-b00c261a3e8f", "tip": 100.00, "description": "2 Protectores para caballos"}]'::jsonb
);