-- Backfill global: corregir serviceFee y deliveryFee para paquetes PRIME no pagados
-- Criterios:
--  - Usuario PRIME activo
--  - Paquete con quote
--  - Estado en ('quote_sent','matched','payment_pending')
--  - Recalcular serviceFee = 20% de quote.price
--  - Si destino es Ciudad de Guatemala => deliveryFee = 0, si no, conservar el valor actual
--  - Recalcular totalPrice y completePrice

DO $$
DECLARE
  v_updated_count integer := 0;
BEGIN
  WITH target AS (
    SELECT 
      p.id,
      p.quote,
      p.package_destination,
      COALESCE(NULLIF(p.quote->>'price','')::numeric, 0) AS price_num,
      ROUND(COALESCE(NULLIF(p.quote->>'price','')::numeric, 0) * 0.20, 2) AS new_service_fee_num,
      CASE 
        WHEN LOWER(p.package_destination) ~ 'guatemala\s*city|ciudad\s*de\s*guatemala|^guatemala$|^guate$' THEN 0
        ELSE COALESCE(NULLIF(p.quote->>'deliveryFee','')::numeric, 0)
      END AS new_delivery_fee_num
    FROM packages p
    JOIN profiles prof ON prof.id = p.user_id
    WHERE prof.trust_level = 'prime'
      AND (prof.prime_expires_at IS NULL OR prof.prime_expires_at > NOW())
      AND p.quote IS NOT NULL
      AND p.status IN ('quote_sent','matched','payment_pending')
  ),
  to_update AS (
    SELECT 
      t.*,
      ROUND(t.price_num + t.new_service_fee_num + t.new_delivery_fee_num, 2) AS new_total_num,
      COALESCE(NULLIF(p.quote->>'serviceFee','')::numeric, 0) AS cur_service_fee,
      COALESCE(NULLIF(p.quote->>'deliveryFee','')::numeric, 0) AS cur_delivery_fee,
      COALESCE(NULLIF(p.quote->>'totalPrice','')::numeric, 0) AS cur_total
    FROM target t
    JOIN packages p ON p.id = t.id
    WHERE 
      abs(COALESCE(NULLIF(p.quote->>'serviceFee','')::numeric, 0) - t.new_service_fee_num) > 0.01
      OR abs(COALESCE(NULLIF(p.quote->>'deliveryFee','')::numeric, 0) - t.new_delivery_fee_num) > 0.01
      OR abs(COALESCE(NULLIF(p.quote->>'totalPrice','')::numeric, 0) - ROUND(t.price_num + t.new_service_fee_num + t.new_delivery_fee_num, 2)) > 0.01
  )
  UPDATE packages p
  SET quote = 
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            p.quote,
            '{serviceFee}', to_jsonb(to_char(u.new_service_fee_num, 'FM999999990.00'))
          ),
          '{deliveryFee}', to_jsonb(to_char(u.new_delivery_fee_num, 'FM999999990.00'))
        ),
        '{totalPrice}', to_jsonb(to_char(u.new_total_num, 'FM999999990.00'))
      ),
      '{completePrice}', to_jsonb(to_char(u.new_total_num, 'FM999999990.00'))
    ),
    updated_at = NOW()
  FROM to_update u
  WHERE p.id = u.id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Paquetes Prime corregidos: %', v_updated_count;
END $$;

-- Reporte de verificación: listar hasta 25 paquetes Prime actuales
DO $$
DECLARE
  rec RECORD;
  cnt integer := 0;
BEGIN
  FOR rec IN 
    SELECT 
      p.id,
      p.status,
      p.item_description,
      p.package_destination,
      (p.quote->>'price')::numeric AS price,
      (p.quote->>'serviceFee')::numeric AS service_fee,
      (p.quote->>'deliveryFee')::numeric AS delivery_fee,
      (p.quote->>'totalPrice')::numeric AS total
    FROM packages p
    JOIN profiles prof ON prof.id = p.user_id
    WHERE prof.trust_level = 'prime'
      AND (prof.prime_expires_at IS NULL OR prof.prime_expires_at > NOW())
      AND p.quote IS NOT NULL
      AND p.status IN ('quote_sent','matched','payment_pending')
    ORDER BY p.updated_at DESC
    LIMIT 25
  LOOP
    cnt := cnt + 1;
    RAISE NOTICE '📦 % | % | % | Dest:% | Q% + Q% + Q% = Q%',
      rec.id, rec.status, rec.item_description, rec.package_destination,
      rec.price, rec.service_fee, rec.delivery_fee, rec.total;
  END LOOP;
  RAISE NOTICE '🔎 Muestras listadas: %', cnt;
END $$;