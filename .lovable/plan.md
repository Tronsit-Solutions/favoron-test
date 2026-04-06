

## Plan: Corregir mensaje de notificación de pago con tarjeta confirmado

### Problema

El mensaje actual dice: *"Ahora puedes proceder a realizar la compra del paquete según las instrucciones recibidas"* — esto implica que el shopper es quien compra el producto, pero en realidad **el viajero es quien realiza la compra**. El shopper solo pagó a Favoron.

Mismo error en los edge functions: *"Procederemos con la compra de tu producto"* — el "procederemos" es ambiguo/incorrecto.

### Mensaje corregido

**Nuevo mensaje para el shopper:**
> "¡Perfecto! Tu pago para el pedido "[item]" ha sido confirmado. El viajero procederá con la compra de tu producto y te mantendremos informado del progreso."

### Cambios (3 archivos)

1. **Migración SQL** — Reemplazar `notify_shopper_package_status()` con el mensaje corregido en el caso `pending_purchase` (línea 30 actual).

2. **`supabase/functions/verify-recurrente-payment/index.ts`** (línea 194) — Actualizar el `_message` de la notificación inline.

3. **`supabase/functions/recurrente-webhook/index.ts`** (línea 207) — Mismo cambio que arriba.

Los 3 lugares usan el mismo mensaje incorrecto y deben corregirse con el mismo texto nuevo.

