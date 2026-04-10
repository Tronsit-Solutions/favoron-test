
-- 1. Registrar uso del boost
INSERT INTO public.boost_code_usage (boost_code_id, traveler_id, trip_id, boost_amount)
VALUES
  ('35582cad-c6fe-412d-9778-66839baf9a3e', '42ff1de3-2156-4636-99b5-ef9bc197e81f', 'f93c75c9-d4ed-4107-b199-f4c18738597d', 22.80),
  ('35582cad-c6fe-412d-9778-66839baf9a3e', '42ff1de3-2156-4636-99b5-ef9bc197e81f', '278dbf7f-1df8-43e6-b446-00ec9b6c1a3e', 29.10);

-- 2. Actualizar acumuladores
UPDATE public.trip_payment_accumulator SET boost_amount = 22.80 WHERE trip_id = 'f93c75c9-d4ed-4107-b199-f4c18738597d';
UPDATE public.trip_payment_accumulator SET boost_amount = 29.10 WHERE trip_id = '278dbf7f-1df8-43e6-b446-00ec9b6c1a3e';

-- 3. Actualizar órdenes de pago
UPDATE public.payment_orders SET amount = 402.80, updated_at = now() WHERE id = 'e4f90468-8b70-4b5d-b7ee-cb990394c1d7';
UPDATE public.payment_orders SET amount = 514.10, updated_at = now() WHERE id = 'b85e2167-7816-492a-9ae3-c46c20673cca';
