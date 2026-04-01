

## Plan: Actualizar propina a Q275 en paquete d6d157cd

### Situación actual
El paquete `d6d157cd-0270-4e2f-a463-1587025a4a6c` y sus dos asignaciones (`bid_submitted` y `bid_pending`) tienen `admin_assigned_tip = 200`. El valor correcto debería ser **275**.

### Cambio

**1. Migración SQL** para corregir los datos:
- Actualizar `packages.admin_assigned_tip` a 275
- Actualizar `packages.products_data` con el tip correcto en cada producto
- Actualizar `package_assignments.admin_assigned_tip` a 275 en las dos asignaciones activas
- Actualizar `package_assignments.products_data` en ambas asignaciones

### Detalle técnico
Un solo archivo de migración que ejecuta 2 UPDATEs:
1. `UPDATE packages SET admin_assigned_tip = 275, products_data = ...` para el paquete
2. `UPDATE package_assignments SET admin_assigned_tip = 275, products_data = ...` para las asignaciones con status `bid_pending` o `bid_submitted`

No se toca la quote porque aún no se ha generado (`quote.price` es NULL en este paquete — la quote se genera al cambiar a `quote_sent`).

