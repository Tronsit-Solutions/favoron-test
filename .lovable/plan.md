

## Plan: Actualizar slides 2/4 y 3/4 del onboarding de viajeros

### Cambios en `src/components/TripForm.tsx`

**Slide 2/4 — "Recibe solicitudes" (línea 115):**
- Corregir que la propina no la define el viajero, viene asignada con cada paquete
- Agregar que si cobran algo en aduana, se reembolsará al entregar factura

Nuevo texto:
> "Los shoppers te enviarán solicitudes de paquetes con una propina asignada. Tú decides cuáles aceptar. Si te cobran algún impuesto en aduana, se te reembolsará al presentar la factura."

**Slide 3/4 — "Cotiza con confianza" (líneas 119-121):**
- Cambiar para indicar que el shopper hará la compra y la enviará a la dirección del viajero, con comprobante y tracking

Nuevo título: "Recibe tu compra"
Nuevo texto:
> "El shopper realizará la compra y la enviará a tu dirección. Se te compartirá el comprobante de compra y el número de tracking."

Cambiar icono de `DollarSign` a `Package` (más apropiado para recepción de compra).

### Resumen de cambios
- Archivo: `src/components/TripForm.tsx`, líneas 112-121
- Solo texto e icono, sin cambios de lógica

