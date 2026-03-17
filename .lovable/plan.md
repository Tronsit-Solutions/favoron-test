

## Problema

El `recurrente_payment_id` que guardamos no coincide con el que aparece en el reporte/dashboard de Recurrente. Esto ocurre por dos razones:

1. **`verify-recurrente-payment` (callback fallback)**: Extrae el payment ID de la respuesta de `GET /api/checkouts/{id}` con la línea `checkoutData.payment_id || checkoutData.id || checkoutId`. Si `payment_id` no existe en la respuesta del checkout, cae al `checkoutData.id` (que es el ID del checkout, no del pago) o al `checkoutId` mismo.

2. **`recurrente-webhook`**: Extrae el payment ID del payload del webhook (`payload.payment?.id || payload.data?.payment_id || ...`), pero si el webhook llega después del callback y el paquete ya fue actualizado a `pending_purchase`, el webhook no sobreescribe el ID incorrecto que ya guardó el callback.

**Resultado**: Se guarda un ID que no es el payment ID real de Recurrente.

---

## Solución propuesta

### 1. En `verify-recurrente-payment/index.ts` — Mejorar extracción del payment ID

Ampliar la búsqueda del payment ID en la respuesta de la API de checkouts. Recurrente puede devolver el ID en diferentes campos según el estado del checkout:

```typescript
// Línea 142 actual:
const paymentId = checkoutData.payment_id || checkoutData.id || checkoutId;

// Cambiar a:
const paymentId = checkoutData.payment_id 
  || checkoutData.last_payment_id
  || checkoutData.payment?.id 
  || checkoutData.payments?.[0]?.id
  || null; // NO usar checkoutId como fallback
```

**Importante**: Eliminar el fallback a `checkoutData.id` y `checkoutId` para evitar guardar un checkout ID como si fuera un payment ID. Si no hay payment ID disponible, guardar `null` — es preferible no tener dato a tener un dato incorrecto.

### 2. En `recurrente-webhook/index.ts` — Siempre actualizar el payment ID

El webhook es la fuente más confiable del payment ID (viene directamente del evento de pago). Modificar para que **siempre actualice** el `recurrente_payment_id` aunque el paquete ya esté en `pending_purchase`:

Después de encontrar el paquete (~línea 118), antes de verificar el evento, agregar lógica:
- Si el paquete ya tiene `status = 'pending_purchase'` y el webhook trae un `paymentId` diferente al guardado → actualizar solo el campo `recurrente_payment_id`.
- Si el paquete no ha sido procesado → flujo normal actual.

### 3. Agregar logging estructurado

En ambas funciones, loguear la respuesta completa de la API de Recurrente con las keys disponibles para poder diagnosticar futuros casos sin adivinar la estructura:

```typescript
console.log('Recurrente API response keys:', Object.keys(checkoutData));
console.log('Payment ID candidates:', {
  payment_id: checkoutData.payment_id,
  last_payment_id: checkoutData.last_payment_id,
  'payment.id': checkoutData.payment?.id,
  'payments[0].id': checkoutData.payments?.[0]?.id,
  id: checkoutData.id,
});
```

### Archivos a modificar
- `supabase/functions/verify-recurrente-payment/index.ts` — Mejorar extracción + eliminar fallback incorrecto + logging
- `supabase/functions/recurrente-webhook/index.ts` — Permitir actualización del payment ID en paquetes ya procesados + logging

