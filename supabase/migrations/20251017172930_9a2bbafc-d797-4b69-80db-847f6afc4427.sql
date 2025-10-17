-- Corregir paquete Prime en payment_pending con cálculos incorrectos
-- Paquete 3065b5e6-e39e-4b16-bb02-eeaa2beed0f4 (Susan Gonzalez)
-- Base: Q94, Service Fee: 37.60 -> 18.80 (Prime 20%), Delivery: 60 -> 0 (Prime + Guatemala City)

UPDATE packages
SET 
  quote = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          quote,
          '{serviceFee}', '18.80'::jsonb
        ),
        '{deliveryFee}', '0'::jsonb
      ),
      '{totalPrice}', '112.80'::jsonb
    ),
    '{completePrice}', '112.80'::jsonb
  ),
  updated_at = NOW()
WHERE id = '3065b5e6-e39e-4b16-bb02-eeaa2beed0f4'
  AND status = 'payment_pending'
  AND quote IS NOT NULL;

-- Búsqueda diagnóstica: Encontrar todos los paquetes Prime con service fees incorrectos
-- Esta es solo una consulta SELECT para identificar otros casos
DO $$
DECLARE
  affected_record RECORD;
  affected_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🔍 Buscando paquetes Prime con service fees incorrectos...';
  
  FOR affected_record IN
    SELECT 
      p.id,
      p.status,
      p.item_description,
      p.package_destination,
      prof.first_name,
      prof.last_name,
      (p.quote->>'price')::numeric as base_price,
      (p.quote->>'serviceFee')::numeric as current_service_fee,
      (p.quote->>'deliveryFee')::numeric as current_delivery_fee,
      (p.quote->>'totalPrice')::numeric as current_total,
      ((p.quote->>'price')::numeric * 0.20) as correct_service_fee_prime,
      CASE 
        WHEN LOWER(p.package_destination) ~ 'guatemala\s*city|ciudad\s*de\s*guatemala|^guatemala$|^guate$' 
        THEN 0 
        ELSE 35 
      END as correct_delivery_fee_prime
    FROM packages p
    LEFT JOIN profiles prof ON prof.id = p.user_id
    WHERE prof.trust_level = 'prime'
      AND prof.prime_expires_at > NOW()
      AND p.quote IS NOT NULL
      AND p.status NOT IN ('completed', 'cancelled', 'delivered')
      AND (p.quote->>'serviceFee')::numeric > ((p.quote->>'price')::numeric * 0.21)
    ORDER BY p.created_at DESC
  LOOP
    affected_count := affected_count + 1;
    RAISE NOTICE '📦 Paquete afectado #%: ID=%, Usuario=% %, Status=%, Base=Q%, ServiceFee=Q% (debería ser Q%), DeliveryFee=Q% (debería ser Q%), Total=Q%',
      affected_count,
      affected_record.id,
      affected_record.first_name,
      affected_record.last_name,
      affected_record.status,
      affected_record.base_price,
      affected_record.current_service_fee,
      affected_record.correct_service_fee_prime,
      affected_record.current_delivery_fee,
      affected_record.correct_delivery_fee_prime,
      affected_record.current_total;
  END LOOP;
  
  IF affected_count = 0 THEN
    RAISE NOTICE '✅ No se encontraron paquetes Prime adicionales con service fees incorrectos';
  ELSE
    RAISE NOTICE '⚠️ Total de paquetes Prime afectados encontrados: %', affected_count;
  END IF;
END $$;