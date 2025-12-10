-- Backfill: Crear trip_payment_accumulator para Martin Farias
INSERT INTO public.trip_payment_accumulator (
  trip_id,
  traveler_id,
  accumulated_amount,
  delivered_packages_count,
  total_packages_count,
  all_packages_delivered,
  payment_order_created
) VALUES (
  '29ef4e70-8ad9-4379-b138-b6405bc02b8b',
  '3aae71b4-b40d-47a6-ba0f-474d2b848dce',
  180.00,
  1,
  1,
  true,
  false
);