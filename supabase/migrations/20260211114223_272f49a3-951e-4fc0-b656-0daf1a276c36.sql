
-- Paso 1: Corregir paquetes que pagaron por transferencia pero están marcados como card
UPDATE public.packages
SET 
  payment_method = 'bank_transfer',
  recurrente_checkout_id = NULL,
  updated_at = NOW()
WHERE payment_method = 'card'
  AND recurrente_payment_id IS NULL
  AND payment_receipt IS NOT NULL
  AND (payment_receipt->>'filePath') IS NOT NULL;

-- Paso 2: Limpiar checkout ID de paquetes que nunca completaron pago con tarjeta
UPDATE public.packages
SET 
  recurrente_checkout_id = NULL,
  updated_at = NOW()
WHERE payment_method = 'card'
  AND recurrente_payment_id IS NULL
  AND recurrente_checkout_id IS NOT NULL
  AND (payment_receipt IS NULL OR (payment_receipt->>'filePath') IS NULL);
