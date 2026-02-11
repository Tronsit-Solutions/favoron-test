

## Corregir visibilidad de pedidos cancelados pagados en la Tabla Financiera

### Problema identificado

El pedido de **Valeria Villeda** (Pachon Gatorade, Q45, pagado con tarjeta confirmada) tiene status `cancelled` y existe en la base de datos con un quote valido. Al investigar:

1. **El paquete esta en la lista de datos elegibles** -- el filtro `advancedStates` incluye `cancelled` y el paquete tiene `quote` como objeto.
2. **El paquete cae en Enero 2026** -- la fecha de pago es `24/1/2026`, pero la tabla por defecto muestra el mes actual (Febrero 2026), por lo que no aparece al abrir la pestaña.
3. **Falta `archived_by_shopper`** en los estados elegibles -- segun la logica documentada, deberia estar incluido para ordenes legadas pagadas.
4. **El filtro de cancelled es demasiado amplio** -- incluye TODOS los paquetes cancelados con quote, incluyendo los que nunca fueron pagados, lo cual contamina la tabla.

### Cambios propuestos

**Archivo:** `src/components/admin/FinancialSummaryTable.tsx`

1. **Agregar `archived_by_shopper` a `advancedStates`** para consistencia con la logica documentada.

2. **Refinar el filtro de cancelled/archived**: Solo incluir paquetes cancelados que tengan evidencia de pago:
   - Tienen `payment_receipt` con datos (comprobante subido)
   - O tienen `recurrente_payment_id` (pago con tarjeta confirmado)
   - Esto evita que paquetes cancelados sin pago aparezcan en el resumen financiero

3. **Corregir formato de mes**: Asegurar que el mes se genere con zero-padding (`01` en vez de `1`) para evitar inconsistencias de filtrado entre meses.

### Detalle tecnico

```text
// Cambio en eligiblePackages:
const advancedStates = [
  'pending_purchase', 'purchase_confirmed', 'shipped', 'in_transit',
  'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office',
  'ready_for_pickup', 'ready_for_delivery', 'out_for_delivery', 'completed'
];

const cancelledButPaid = ['cancelled', 'archived_by_shopper'];

return packages.filter(pkg => {
  if (!pkg.quote || typeof pkg.quote !== 'object') return false;

  // Incluir estados activos normalmente
  if (advancedStates.includes(pkg.status)) return true;

  // Cancelados/archivados solo si fueron pagados
  if (cancelledButPaid.includes(pkg.status)) {
    const hasReceipt = pkg.payment_receipt && 
      typeof pkg.payment_receipt === 'object' &&
      (pkg.payment_receipt as any).filePath;
    const hasCardPayment = !!pkg.recurrente_payment_id;
    return hasReceipt || hasCardPayment;
  }

  return false;
});
```

Para el formato de mes, cambiar `toLocaleDateString('es-GT')` a un formato consistente con zero-padding usando `date-fns format()` para evitar que `1` vs `01` cause problemas de matching.

### Resultado esperado
- El pedido de Valeria Villeda aparecera en Enero 2026 (ya aparece, pero el filtro por defecto muestra Febrero)
- Los paquetes cancelados sin pago no contaminaran la tabla
- Los meses tendran formato consistente para el filtrado

