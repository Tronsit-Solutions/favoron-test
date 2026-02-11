

## Fix: Usar serviceFee de metadatos en lugar de calcular por resta

### Problema actual

Linea 384 del archivo `FinancialSummaryTable.tsx`:
```
const refundServiceFee = Math.max(0, refund.amount - refundTips);
```

Esto asume que todo lo que no es tip es serviceFee, pero el monto del reembolso tambien incluye:
- **deliveryFee** (ej: Q60)
- **cancellationPenalty** (ya restada del monto)

Ejemplo real (Valeria Villeda):
- amount: Q190, tip: Q90, serviceFee real: Q45, deliveryFee: Q60
- Calculo actual: `190 - 90 = Q100` como Fee Favoron (INCORRECTO)
- Calculo correcto: `Q45` como Fee Favoron

### Solucion

En `src/components/admin/FinancialSummaryTable.tsx`, lineas 374-384, cambiar la logica para extraer el `serviceFee` directamente de los metadatos de `cancelled_products`:

```typescript
// Extraer tips
let refundTips = 0;
let refundServiceFee = 0;

if (cancelledProducts.length > 0) {
  refundTips = cancelledProducts.reduce((sum, p) => {
    if (p.tip !== undefined) return sum + (Number(p.tip) || 0);
    if (p.adminAssignedTip !== undefined) return sum + (Number(p.adminAssignedTip) || 0);
    return sum;
  }, 0);

  // Usar serviceFee guardado en metadatos (nuevo formato)
  refundServiceFee = cancelledProducts.reduce((sum, p) => {
    if (p.serviceFee !== undefined) return sum + (Number(p.serviceFee) || 0);
    return sum;
  }, 0);

  // Fallback para registros antiguos sin serviceFee en metadatos:
  // usar el calculo por resta solo si ningun producto tiene serviceFee
  if (refundServiceFee === 0 && refundTips > 0) {
    refundServiceFee = Math.max(0, refund.amount - refundTips);
  }
}
```

### Logica del fallback

- Registros nuevos (como Valeria): tienen `serviceFee` explicito en cancelled_products -> lo usa directamente
- Registros viejos (como los otros 2 sin serviceFee): no tienen el campo -> usa el calculo por resta como fallback

### Archivo a modificar

Solo `src/components/admin/FinancialSummaryTable.tsx`, lineas 374-384.

