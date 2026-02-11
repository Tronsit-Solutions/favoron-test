

## Fix: Columna "Ingreso Favoron" en filas de reembolso

### Problema
La columna "Ingreso Favoron" tiene un override en el render (linea 747) que ignora el valor calculado de `favoronRevenue` y muestra el monto total del reembolso:

```text
// Linea 747 actual:
{item.isRefund ? `-${formatCurrency(item.refundAmount || 0)}` : formatCurrency(item.favoronRevenue)}
```

Esto significa que aunque el calculo en lineas 360-361 es correcto (`favoronRevenue: -refundServiceFee`), la celda siempre muestra `-refund.amount` para reembolsos.

### Solucion

**Archivo: `src/components/admin/FinancialSummaryTable.tsx` (linea 747)**

Cambiar para que use `item.favoronRevenue` directamente (que ya contiene el valor negativo correcto):

```text
// Antes:
{item.isRefund ? `-${formatCurrency(item.refundAmount || 0)}` : formatCurrency(item.favoronRevenue)}

// Despues:
{formatCurrency(item.favoronRevenue)}
```

El valor de `favoronRevenue` ya es negativo para reembolsos (ej: -7.50), asi que `formatCurrency` lo mostrara correctamente.

### Resultado esperado
- Reembolso Q22.50 (tip=Q15, serviceFee=Q7.50): Tip Viajero=-Q15.00, Ingreso Favoron=-Q7.50
- Reembolso Q205 (tip=Q140): Tip Viajero=-Q140.00, Ingreso Favoron=-Q65.00

