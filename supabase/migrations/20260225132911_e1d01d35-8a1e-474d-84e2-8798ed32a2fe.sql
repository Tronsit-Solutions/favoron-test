
-- Insertar viaje falso y paquete completado para testear rating
DO $$
DECLARE
  fake_trip_id uuid;
BEGIN
  -- 1. Trip falso (viajero: Glenda Diaz)
  INSERT INTO trips (
    user_id, from_city, to_city, from_country, to_country,
    status, arrival_date, first_day_packages, last_day_packages,
    delivery_date, delivery_method, package_receiving_address
  ) VALUES (
    '773bfe46-c746-4bba-a1e5-8694b5da4217',
    'Miami', 'Guatemala City', 'Estados Unidos', 'Guatemala',
    'approved',
    now() + interval '10 days',
    now() + interval '1 day',
    now() + interval '8 days',
    now() + interval '12 days',
    'oficina',
    '{"address": "Test Address", "city": "Miami"}'::jsonb
  ) RETURNING id INTO fake_trip_id;

  -- 2. Package completado (shopper: admin)
  INSERT INTO packages (
    user_id, item_description, estimated_price, delivery_deadline,
    matched_trip_id, status, purchase_origin, package_destination,
    delivery_method, feedback_completed, quote, products_data,
    additional_notes
  ) VALUES (
    '5e3c944e-9130-4ea7-8165-b8ec9d5abf6f',
    'AirPods Pro 2 - TEST RATING', 249,
    now() + interval '30 days',
    fake_trip_id,
    'completed', 'Estados Unidos', 'Guatemala',
    'pickup', false,
    '{"service_fee": 100, "delivery_fee": 25, "total": 374}'::jsonb,
    '[{"itemDescription": "AirPods Pro 2", "estimatedPrice": "249", "quantity": "1", "requestType": "online"}]'::jsonb,
    'Paquete falso para testear rating de viajero'
  );
END $$;
