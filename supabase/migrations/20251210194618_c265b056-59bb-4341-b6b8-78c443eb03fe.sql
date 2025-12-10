-- Backfill: Crear trip_payment_accumulator para Eduardo Sinibaldi
INSERT INTO public.trip_payment_accumulator (
  trip_id,
  traveler_id,
  accumulated_amount,
  delivered_packages_count,
  total_packages_count,
  all_packages_delivered,
  payment_order_created
) VALUES (
  '3938eb78-83f8-49ed-911c-d1a551c1d8aa',
  'e7c4861b-c524-4651-8ef8-75f8ae29f447',
  80.00,
  1,
  1,
  true,
  false
);

-- Backfill: Crear trip_payment_accumulator para Lourdes Marroquin
INSERT INTO public.trip_payment_accumulator (
  trip_id,
  traveler_id,
  accumulated_amount,
  delivered_packages_count,
  total_packages_count,
  all_packages_delivered,
  payment_order_created
) VALUES (
  '7e8e9afe-7572-4a4f-a57e-af3a71752287',
  'e0eefd27-cdcb-4652-8802-2ae0251bb921',
  60.00,
  1,
  1,
  true,
  false
);