
-- 1) Corregir el monto de la orden de pago de Nicole usando su snapshot histórico
--    Orden: 37111137-4e1b-4e69-9850-df65e3d4d6a0
WITH recalculated AS (
  SELECT
    po.id,
    COALESCE(
      (
        SELECT SUM((elem->'quote'->>'price')::numeric)
        FROM jsonb_array_elements(po.historical_packages) AS elem
        WHERE elem ? 'quote' AND elem->'quote' ? 'price'
      ),
      0
    ) AS new_amount
  FROM public.payment_orders po
  WHERE po.id = '37111137-4e1b-4e69-9850-df65e3d4d6a0'
)
UPDATE public.payment_orders po
SET amount = r.new_amount
FROM recalculated r
WHERE po.id = r.id;

-- 2) Alinear el acumulador del viaje con la suma de tips de paquetes elegibles
--    Viaje: 10f0245f-9813-4823-89e3-647636d929c9
--    Viajero (Nicole): b9f9e27a-118d-4d46-af4d-45f983d05376
UPDATE public.trip_payment_accumulator tpa
SET 
  accumulated_amount = COALESCE((
    SELECT SUM((p.quote->>'price')::numeric)
    FROM public.packages p
    WHERE p.matched_trip_id = tpa.trip_id
      AND p.status IN ('completed', 'delivered_to_office')
      AND (
        p.status != 'delivered_to_office' OR (
          p.office_delivery IS NOT NULL
          AND p.office_delivery->>'traveler_declaration' IS NOT NULL
          AND p.office_delivery->>'admin_confirmation' IS NOT NULL
        )
      )
  ), 0),
  delivered_packages_count = (
    SELECT COUNT(*)
    FROM public.packages p
    WHERE p.matched_trip_id = tpa.trip_id
      AND p.status IN ('completed', 'delivered_to_office')
      AND (
        p.status != 'delivered_to_office' OR (
          p.office_delivery IS NOT NULL
          AND p.office_delivery->>'traveler_declaration' IS NOT NULL
          AND p.office_delivery->>'admin_confirmation' IS NOT NULL
        )
      )
  ),
  total_packages_count = (
    SELECT COUNT(*)
    FROM public.packages p
    WHERE p.matched_trip_id = tpa.trip_id
      AND p.status NOT IN ('rejected','cancelled')
  ),
  updated_at = now()
WHERE tpa.trip_id = '10f0245f-9813-4823-89e3-647636d929c9'
  AND tpa.traveler_id = 'b9f9e27a-118d-4d46-af4d-45f983d05376';
