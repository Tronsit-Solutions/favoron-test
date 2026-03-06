

## Unificar cálculo de Ingresos Favorón en el Dashboard

### Problema
Las tarjetas del `FinancialDashboard` usan `calculateFavoronRevenue()` que aplica `0.50 × (tip + serviceFee)`, produciendo un valor inflado. La tabla resumen financiera ya lo hace bien sumando el `serviceFee` del quote directamente.

### Cambio

**`src/components/admin/FinancialDashboard.tsx`**:

Reemplazar el cálculo de `favoronRevenue` en el `useMemo` de `financialMetrics`:

```tsx
// Antes:
const serviceFee = calculateServiceFee(basePrice, undefined, rates);
const revenue = calculateFavoronRevenue(basePrice, serviceFee, undefined);

// Después:
const serviceFee = parseFloat(quote?.serviceFee || '0');
```

Sumar directamente el `serviceFee` del quote de cada paquete completado, igual que hace la tabla resumen financiera. Mantener la resta de descuentos (`totalDiscounts`).

También se pueden limpiar los imports de `calculateFavoronRevenue` y `calculateServiceFee` si ya no se usan en este archivo.

