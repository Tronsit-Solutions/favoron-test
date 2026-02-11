

## Corregir distribucion de reembolsos en la tabla financiera

### Problema
Cuando se crea una fila de reembolso en la tabla financiera, todo el monto negativo se asigna a la columna "Ingreso Favoron" (`favoronRevenue: -refund.amount`). Pero el reembolso incluye tanto el tip del viajero como el service fee de Favoron. Esto infla negativamente los ingresos de Favoron y no refleja que parte del reembolso corresponde al viajero.

### Ejemplo con datos reales
- Reembolso de Q22.50: tip=Q15, serviceFee=Q7.50
- Actualmente: Tip Viajero=Q0, Ingreso Favoron=-Q22.50
- Correcto: Tip Viajero=-Q15, Ingreso Favoron=-Q7.50

### Solucion

**Archivo: `src/components/admin/FinancialSummaryTable.tsx`** (lineas 319-356)

Extraer el desglose del tip y service fee desde `cancelled_products` para distribuir correctamente el monto negativo:

1. **Formato nuevo** (productos con campos `tip` y `serviceFee`): sumar directamente esos campos
2. **Formato antiguo** (productos con solo `adminAssignedTip`): el tip es la suma de `adminAssignedTip`, y el service fee es `refund.amount - totalTips - penalty`
3. Si no hay datos suficientes, usar el paquete original para obtener la proporcion

### Detalle tecnico

```text
Antes:
  travelerTip: 0
  favoronRevenue: -refund.amount

Despues:
  travelerTip: -(suma de tips de productos cancelados)
  favoronRevenue: -(refund.amount - suma de tips)
```

Esto tambien corrige los totales en el footer de la tabla y en la exportacion a Excel, ya que ambos usan los mismos campos `travelerTip` y `favoronRevenue`.
