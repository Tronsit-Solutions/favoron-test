

## Nueva Tabla Financiera: Ingresos y Egresos Detallados

### Concepto
Agregar una **4ta pestaña** ("Flujo de Caja" o "Ingresos y Egresos") en `FinancialTablesSection` con dos secciones:

1. **Ingresos (pagos recibidos de shoppers)**: cada paquete pagado desglosado en columnas: Tip Viajero, Service Fee, Delivery Fee, Descuento/Boost
2. **Egresos (pagos hechos a viajeros)**: payment_orders completadas/aprobadas con monto, viajero, viaje, comprobante de pago

### Cambios

**1. `src/components/admin/FinancialTablesSection.tsx`**
- Agregar 4ta pestaña "Flujo de Caja" con `grid-cols-4`
- Importar nuevo componente `CashFlowTable`

**2. Crear `src/components/admin/CashFlowTable.tsx`**
- Selector de mes (mismo patrón que FinancialSummaryTable)
- **Sección Ingresos**: query a `packages` con estados pagados, usando `getQuoteValues()` para extraer:
  - Fecha, Shopper, ID Pedido, Tip Viajero (`price`), Service Fee (`serviceFee`), Delivery Fee (`deliveryFee`), Descuento (`discountAmount`), Total Pagado (`finalTotalPrice`), Método de Pago
- **Sección Egresos**: query a `payment_orders` con status `completed` o `approved`:
  - Fecha, Viajero, Trip ID, Monto, Estado, Comprobante (con botón para ver receipt)
- Cards de resumen arriba: Total Ingresos, Total Egresos, Neto
- Botón de descarga Excel (mismo patrón existente)

### Datos disponibles
- **Ingresos**: `packages.quote` ya contiene `price` (tip), `serviceFee`, `deliveryFee`, `discountAmount`, `finalTotalPrice` via `getQuoteValues()`
- **Egresos**: `payment_orders` tiene `amount`, `traveler_id`, `trip_id`, `status`, `receipt_url`, `receipt_filename`, `completed_at`
- Boost: `quote.discountAmount` incluye tanto descuentos como boosts aplicados; el código del descuento está en `quote.discountCode`

### Archivos
- **Crear**: `src/components/admin/CashFlowTable.tsx`
- **Modificar**: `src/components/admin/FinancialTablesSection.tsx` (agregar pestaña)

