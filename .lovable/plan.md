
## Contrapartida para paquetes cancelados pagados

### Situación actual
El paquete de Raul Secaira (`7c021d06`) fue pagado (tiene `payment_receipt` con comprobante) y luego cancelado (`status: 'cancelled'`). La tabla financiera lo muestra como ingreso positivo (Q360: tip Q240 + serviceFee Q120), pero **no existe un `refund_order`** asociado, por lo que no aparece ninguna contrapartida negativa.

### Problema
Cuando un paquete pagado se cancela sin crear un refund_order, el resumen financiero sigue mostrando el ingreso como si fuera válido. La cancelación debería reflejarse como una fila negativa automática.

### Solución

En `src/components/admin/FinancialSummaryTable.tsx`, después de generar `refundData` (línea ~430), agregar lógica para generar **contrapartidas automáticas** para paquetes cancelados-pero-pagados que **no tengan un refund_order asociado**:

1. Filtrar los `eligiblePackages` con `status === 'cancelled'` o `'archived_by_shopper'` que tengan evidencia de pago
2. Excluir los que ya tienen un `refund_order` (para no duplicar)
3. Generar una fila negativa por cada uno, con:
   - `totalToPay: -totalOriginal`
   - `travelerTip: -tipOriginal`  
   - `favoronRevenue: -serviceFeeOriginal`
   - `messengerPayment: -deliveryFeeOriginal`
   - `paymentMethod: 'Cancelación'`
   - Descripción: `"Cancelación - [producto]"`
   - Fecha: fecha de actualización del paquete (cuando se canceló)

4. Incluir estas filas en el array combinado junto con `packageData`, `primeData` y `refundData`

Esto hará que el paquete de Raul aparezca dos veces: una como ingreso (+Q360) y otra como cancelación (-Q360), reflejando correctamente que el dinero debe devolverse.
