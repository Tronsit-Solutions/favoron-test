

## Corregir metodo de pago en paquetes con checkout fallido de Recurrente

### Problema
Hay 18 paquetes marcados con `payment_method = 'card'` que tienen un `recurrente_checkout_id` (el formulario de pago se genero) pero **no tienen `recurrente_payment_id`** (el pago nunca fue confirmado por el webhook de Recurrente). Algunos de estos usuarios terminaron pagando por transferencia bancaria.

### Paquetes afectados (18 total)

| Usuario | Monto | Status | Tiene comprobante transferencia? |
|---------|-------|--------|----------------------------------|
| Maria Cordero | Q72 | ready_for_pickup | Si (IMG_8380.png) |
| Gabriel Gonzalez | Q285 | in_transit | Verificar |
| Virginia Morales | Q111 | quote_expired | Verificar |
| Maria Jose Juarez | Q90 | received_by_traveler | Verificar |
| Gener Dardon | Q120 | received_by_traveler | Verificar |
| Nicole Berger | Q174 | ready_for_delivery | Verificar |
| Jose Garcia | Q180 | cancelled | Verificar |
| Eduardo Giron | Q222 | in_transit | Verificar |
| Emilie Salkeld | Q300 | pending_purchase | Verificar |
| Sofia Lorenzana | Q90 | quote_expired | Verificar |
| Luze Lopez | Q112.50 | quote_expired | Verificar |
| Raul Garcia | Q90 | quote_expired | Verificar |
| Beatriz Bautista | Q105 | pending_purchase | Verificar |
| Rodrigo Orantes | Q72 | cancelled | Verificar |
| Katia Leal | Q15 | quote_expired | Verificar |
| Carmen Castillo | Q144 | ready_for_pickup | Verificar |
| Fernando Casco | Q105 | ready_for_pickup | Verificar |
| Admin Favoron | Q74 | quote_expired | Verificar |

### Plan de accion

**Paso 1: Identificar cuales pagaron por transferencia**
Consultar cuales de los 18 tienen `payment_receipt` con datos de comprobante (archivo subido). Estos deben corregirse a `bank_transfer`.

**Paso 2: Migracion SQL (sin notificaciones)**

```text
-- Corregir paquetes que pagaron por transferencia pero estan marcados como card
UPDATE public.packages
SET 
  payment_method = 'bank_transfer',
  recurrente_checkout_id = NULL,
  updated_at = NOW()
WHERE payment_method = 'card'
  AND recurrente_payment_id IS NULL
  AND payment_receipt IS NOT NULL
  AND (payment_receipt->>'filePath') IS NOT NULL;

-- Limpiar checkout ID de paquetes que nunca completaron pago con tarjeta
-- (dejar payment_method como card para los que aun podrian intentar)
UPDATE public.packages
SET 
  recurrente_checkout_id = NULL,
  updated_at = NOW()
WHERE payment_method = 'card'
  AND recurrente_payment_id IS NULL
  AND recurrente_checkout_id IS NOT NULL
  AND (payment_receipt IS NULL OR (payment_receipt->>'filePath') IS NULL);
```

**Paso 3: Verificar deteccion de metodo de pago en tabla financiera**
Confirmar que `FinancialSummaryTable.tsx` usa la logica correcta para detectar el metodo de pago (ya deberia funcionar bien con estos cambios en la BD).

### Resultado esperado
- Paquetes que pagaron por transferencia se muestran correctamente como "Transferencia"
- Paquetes que nunca completaron pago con tarjeta se limpian para evitar confusion
- La tabla financiera refleja los metodos de pago reales
