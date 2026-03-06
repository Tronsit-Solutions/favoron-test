

## Alinear RevenueDetailSheet con FinancialSummaryTable

### Problema identificado

La hoja de detalle (RevenueDetailSheet) y la tabla financiera (FinancialSummaryTable) calculan el service fee de formas distintas, causando discrepancias:

1. **Extracción del service fee de reembolsos**: La tabla usa `cancelled_products[].serviceFee` (campo correcto), el sheet usa `cancelled_products[].proportionalServiceFee` (campo incorrecto/inexistente).

2. **Filtrado de reembolsos por mes**: La tabla muestra TODOS los reembolsos completados y los filtra por `completed_at` (fecha de pago). El sheet filtra reembolsos solo si el `package_id` pertenece a un paquete creado en ese mes, lo cual excluye reembolsos de paquetes de meses anteriores completados en este mes.

3. **Filtrado de cancelaciones**: Similar al punto anterior, la tabla incluye cancelaciones sin importar cuándo se creó el paquete original (filtra por `updated_at`/fecha de pago), mientras el sheet filtra por `created_at` del paquete.

4. **Uso de `getQuoteValues`**: La tabla usa la función centralizada `getQuoteValues()` para extraer el service fee. El sheet lee `quote.serviceFee` directamente (mismo resultado en la práctica, pero mejor usar la función centralizada por consistencia).

### Cambios propuestos

**`src/components/admin/charts/RevenueDetailSheet.tsx`**:

1. Usar `getQuoteValues()` de `@/lib/quoteHelpers` en lugar de leer `quote.serviceFee` directamente
2. Corregir la extracción del service fee de reembolsos: usar `cancelled_products[].serviceFee` (no `proportionalServiceFee`), con fallback `amount - tips - deliveryFee` para registros legacy
3. Alinear el filtrado de reembolsos: filtrar por `completed_at` dentro del mes seleccionado (no por package_id del mes)
4. Alinear el filtrado de cancelaciones pagadas: usar la misma lógica de evidencia de pago que la tabla (`filePath`, `recurrente_payment_id`, `method === 'card'`)

Estos cambios harán que el neto mostrado en el sheet coincida exactamente con la columna "Favorón Revenue" de la tabla financiera para cualquier mes.

