

## Bug: QuoteDialog usa `package_destination` en vez de `cityArea` al crear cotizaciones

### Problema
Liza Salazar (y cualquier usuario cuyo `package_destination` no coincida con los patrones de Guatemala City o municipios del departamento) recibe Q60 de envío porque `QuoteDialog.tsx` pasa `packageDetails.package_destination` como parámetro `cityArea` a `createNormalizedQuote`, ignorando el `cityArea` real de la dirección de entrega confirmada.

Ironicamente, el mismo archivo usa correctamente `packageDetails.cityArea || packageDetails.deliveryAddress?.cityArea` en **5 otros lugares** (líneas 278, 405, 1294, 1528) para cálculos de display, pero NO en las 2 llamadas que realmente generan la cotización.

### Lugares afectados en `src/components/QuoteDialog.tsx`

1. **Línea 519** — Recalculación cuando el shopper excluye productos:
   - Actualmente: `packageDetails.package_destination`
   - Correcto: `packageDetails.cityArea || packageDetails.deliveryAddress?.cityArea || packageDetails.package_destination`

2. **Línea 573** — Traveler aceptando admin_assigned_tip:
   - Actualmente: `packageDetails.package_destination`
   - Correcto: `packageDetails.cityArea || packageDetails.deliveryAddress?.cityArea || packageDetails.package_destination`

3. **Línea 590** — Traveler enviando cotización manual:
   - Actualmente: `packageDetails.package_destination`
   - Correcto: `packageDetails.cityArea || packageDetails.deliveryAddress?.cityArea || packageDetails.package_destination`

### Cambio
Actualizar las 3 llamadas a `createNormalizedQuote` en `QuoteDialog.tsx` para usar la misma lógica de `cityArea` que ya se usa en el resto del archivo: `packageDetails.cityArea || packageDetails.deliveryAddress?.cityArea || packageDetails.package_destination`.

### Impacto
Esto corrige que usuarios en municipios del departamento de Guatemala (Fraijanes, Mixco, etc.) sean cobrados Q60 en vez de Q45, o que usuarios en Ciudad de Guatemala sean cobrados Q45/Q60 en vez de Q25.

