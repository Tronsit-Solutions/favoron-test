

## Acortar labels de status en móvil y corregir lógica de expiración

### Problema
1. Los labels de status son muy largos para móvil (ej: "Cotización Aceptada - Pendiente Pago", "Pago Confirmado - Compra Pendiente")
2. Cuando la cotización ya expiró pero el status sigue en `quote_accepted` o `payment_pending`, el badge no muestra "Cotización Expirada"

### Cambios en `src/hooks/useStatusHelpers.tsx`

**1. Acortar labels largos (líneas 82, 92):**
- `quote_accepted`: "Cotización Aceptada - Pendiente Pago" → **"Pendiente Pago"**
- `pending_purchase`: "Pago Confirmado - Compra Pendiente" → **"Cotización Pagada"**

**2. Ampliar detección de expiración (líneas 58-65):**
Actualmente solo detecta expiración en `quote_sent`. Agregar detección para `quote_accepted` y `payment_pending`:

```tsx
if (pkg) {
  if (pkg.quote_expires_at && new Date(pkg.quote_expires_at) < new Date() &&
      ['quote_sent', 'quote_accepted', 'payment_pending'].includes(pkg.status)) {
    effectiveStatus = 'quote_expired';
  }
}
```

También actualizar `getExpirationInfo` (líneas 15-23) para cubrir estos mismos estados adicionales.

### Resultado
- Cards móviles con labels cortos y legibles
- Cotizaciones expiradas correctamente identificadas sin importar en qué sub-estado quedaron

