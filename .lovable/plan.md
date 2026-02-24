

## Corregir useTravelerTipsReport y platform_stats_snapshot

### Problema
El hook `useTravelerTipsReport.tsx` usa `quote.serviceFee` (ingreso de Favoron) para calcular los tips distribuidos a viajeros, cuando deberia usar `quote.price` (la propina real del viajero). Esto infla el total de ~Q37K a ~Q92K. Ademas, `platform_stats_snapshot` tiene un valor hardcoded de Q85,000 desactualizado.

### Cambios

**1. `src/hooks/useTravelerTipsReport.tsx` (lineas 54-70)**

Cambiar la lectura de `quote.serviceFee` a `quote.price`:

```typescript
// ANTES (incorrecto):
const serviceFee = quote?.serviceFee;
if (serviceFee !== null && serviceFee !== undefined) {
  const tipAmount = parseFloat(String(serviceFee)) || 0;

// DESPUES (correcto):
const price = quote?.price;
if (price !== null && price !== undefined) {
  const tipAmount = parseFloat(String(price)) || 0;
```

Tambien debe considerar `adminAssignedTip` de productos no cancelados (consistente con la logica de `getActiveTipFromPackage`), pero como primera correccion el cambio de `serviceFee` -> `price` ya resuelve la discrepancia principal.

**2. Actualizar `platform_stats_snapshot`**

Ejecutar un UPDATE para corregir el valor de `total_tips_distributed` de Q85,000 al valor real (~Q37,070). El valor exacto se calculara al momento de la implementacion consultando la suma de `quote.price` de paquetes completados.

### Resultado esperado
- Las metricas de "Total Tips" en la tarjeta de Viajeros mostraran ~Q37K en lugar de ~Q92K
- El snapshot publico reflejara el valor correcto

