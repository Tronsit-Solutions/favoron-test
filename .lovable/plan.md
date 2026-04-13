

## Plan: Corregir flujo de pagos Recurrente — Prevenir pérdida de confirmaciones

### Problema raíz

El pago de Gensuya (paquete `8e8c9866`) fue procesado exitosamente en Recurrente, pero el paquete quedó en `payment_pending` con `recurrente_checkout_id: null` y `payment_method: bank_transfer`. Hay **tres puntos de fallo** simultáneos:

1. **El webhook de Recurrente nunca se ejecutó** — no hay ningún log de la función `recurrente-webhook`. La URL del webhook probablemente no está configurada correctamente en el panel de Recurrente, o apunta a una URL incorrecta.

2. **El fallback de callback (`verify-recurrente-payment`) depende de `recurrente_checkout_id`** — si este campo es `null`, la verificación falla silenciosamente con "No checkout ID found".

3. **El handler de `payment.failed` en el webhook (línea 218-233) hace `recurrente_checkout_id: null` y resetea a `bank_transfer`** — si un evento de fallo llega antes del éxito, destruye la referencia y el pago se pierde.

### Acción inmediata: Arreglar el paquete de Gensuya

Migración SQL para actualizar manualmente el paquete a `pending_purchase` con un `payment_receipt` que registre la verificación manual.

### Cambios preventivos

#### 1. No borrar `recurrente_checkout_id` en fallo de pago
**Archivo:** `supabase/functions/recurrente-webhook/index.ts` (líneas 222-229)
- Cambiar el handler de `payment.failed`: solo resetear `payment_method` a `bank_transfer` pero **mantener** el `recurrente_checkout_id` para que el fallback de verificación siga funcionando.

#### 2. Agregar búsqueda por metadata en `verify-recurrente-payment`
**Archivo:** `supabase/functions/verify-recurrente-payment/index.ts`
- Si `recurrente_checkout_id` es null, buscar en Recurrente API los checkouts recientes por `metadata.package_id` como fallback adicional.
- Alternativa más simple: guardar el `checkout_id` en una columna de historial o log que no se borre.

#### 3. Agregar historial de checkout IDs
**Archivo:** `supabase/functions/create-recurrente-checkout/index.ts`
- Antes de limpiar `recurrente_checkout_id`, guardar el anterior en `payment_receipt` como `previous_checkout_ids` para auditoría.

#### 4. Mejorar el callback page con reintento
**Archivo:** `src/pages/PaymentCallback.tsx`
- Si la verificación falla, mostrar un botón de "Reintentar verificación" en vez de solo redirigir.
- Agregar polling (cada 3s, máximo 5 intentos) para esperar a que el webhook actualice el estado.

#### 5. Verificar/documentar la URL del webhook
- La URL del webhook en Recurrente debe ser: `https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/recurrente-webhook`
- Esto debe verificarse en el panel de administración de Recurrente (app.recurrente.com).

### Resumen de archivos a modificar

| Archivo | Cambio |
|---|---|
| Migración SQL | Fix manual del paquete de Gensuya |
| `supabase/functions/recurrente-webhook/index.ts` | No borrar checkout_id en fallo |
| `supabase/functions/verify-recurrente-payment/index.ts` | Fallback sin checkout_id |
| `supabase/functions/create-recurrente-checkout/index.ts` | Guardar historial de checkout IDs |
| `src/pages/PaymentCallback.tsx` | Polling + botón de reintento |

### Resultado
- Los pagos exitosos nunca se perderán, incluso si el webhook falla
- El checkout_id se preserva para verificación posterior
- El usuario ve feedback claro y puede reintentar la verificación
- Se necesita verificar la URL del webhook en el panel de Recurrente

