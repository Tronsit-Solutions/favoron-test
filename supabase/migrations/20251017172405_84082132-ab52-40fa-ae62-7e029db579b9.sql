-- Backfill: Corregir cotizaciones de paquetes Prime no pagados
-- Aplicar tarifa Prime correcta: 20% service fee y Q0 delivery fee para Guatemala City
-- Solo afecta paquetes en estado 'quote_sent' o 'matched' (no pagados)

-- Paquete 1: ID 3065b5e6-e39e-4b16-bb02-eeaa2beed0f4
-- Corrección: serviceFee 37.60 -> 18.80, deliveryFee 60 -> 0
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
  AND status IN ('quote_sent', 'matched')
  AND quote IS NOT NULL;

-- Paquete 2: ID 2d3bd5f7-59b7-4ef3-a226-00363e51a23f
-- Corrección: serviceFee 38.40 -> 19.20, deliveryFee 60 -> 0
UPDATE packages
SET 
  quote = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          quote,
          '{serviceFee}', '19.20'::jsonb
        ),
        '{deliveryFee}', '0'::jsonb
      ),
      '{totalPrice}', '115.20'::jsonb
    ),
    '{completePrice}', '115.20'::jsonb
  ),
  updated_at = NOW()
WHERE id = '2d3bd5f7-59b7-4ef3-a226-00363e51a23f'
  AND status IN ('quote_sent', 'matched')
  AND quote IS NOT NULL;

-- Paquete 3: ID 90368c16-76cc-4eaa-b2c9-fffc0cd6fd45
-- Corrección: serviceFee 54.40 -> 27.20, deliveryFee 60 -> 0
UPDATE packages
SET 
  quote = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          quote,
          '{serviceFee}', '27.20'::jsonb
        ),
        '{deliveryFee}', '0'::jsonb
      ),
      '{totalPrice}', '163.20'::jsonb
    ),
    '{completePrice}', '163.20'::jsonb
  ),
  updated_at = NOW()
WHERE id = '90368c16-76cc-4eaa-b2c9-fffc0cd6fd45'
  AND status IN ('quote_sent', 'matched')
  AND quote IS NOT NULL;