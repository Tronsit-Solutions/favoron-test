

## Agregar columnas de desglose a filas de ingreso en el Consolidado

### Qué cambia
Las filas de tipo "Ingreso" en la tabla consolidada mostrarán las columnas adicionales: **Tip Viajero**, **Service Fee**, **Delivery Fee** y **Descuento**, igual que en la vista detallada de ingresos. Las filas de Egreso y Reembolso mostrarán "—" en esas columnas.

### Implementación — `src/components/admin/CashFlowTable.tsx`

**1. Ampliar la interfaz de `consolidatedRows`**
Agregar campos opcionales `tipViajero`, `serviceFee`, `deliveryFee`, `discount` al mapeo de income rows (líneas 174-185). Para expense y refund, dejar en 0/undefined.

**2. Agregar columnas al header de la tabla consolidada** (línea 372-379)
Insertar 4 columnas entre "Descripción" y "Monto": Tip Viajero, Service Fee, Delivery Fee, Descuento.

**3. Renderizar celdas en el body** (líneas 400-401)
Para filas `income`: mostrar los valores con `formatCurrency`. Para `expense`/`refund`: mostrar "—".

**4. Actualizar Excel export** (líneas 248-255)
Agregar las 4 columnas al `consolidatedSheet`, con valores para income y vacío/0 para los demás.

### Archivos
- **Modificar**: `src/components/admin/CashFlowTable.tsx`

