

## Alinear valores del detalle con la gráfica

### Problema

La gráfica calcula `netFavoronRevenue` usando lógica de `useDynamicReports`, pero el `RevenueDetailSheet` usa lógica diferente en dos puntos clave:

1. **Cancelaciones**: La gráfica agrupa por `updated_at` (fecha de cancelación). El detail sheet filtra por `created_at` (fecha de creación del paquete). Resultado: un paquete creado en enero y cancelado en marzo aparece en marzo en la gráfica pero no aparece en el detalle de marzo.

2. **Refunds y Cancelaciones — timezone**: La gráfica usa `toMonthKey()` que es un simple `substring(0,7)` del timestamp UTC. El detail sheet usa rangos con offset Guatemala (`T06:00:00.000Z`). Un reembolso completado el 1 de marzo a las 2am UTC (todavía 28 feb en Guatemala) aparecería en marzo en la gráfica pero en febrero en el detail sheet.

### Cambios

**`src/components/admin/charts/RevenueDetailSheet.tsx`**:

1. **Cancelaciones**: Cambiar el filtro de `created_at` a `updated_at` para que coincida con la gráfica
2. **Refunds y Cancelaciones**: Usar rangos UTC simples (`${month}-01T00:00:00.000Z` al siguiente mes) en lugar del offset Guatemala, para coincidir con el `toMonthKey()` que usa la gráfica
3. **Active packages (gross)**: Mantener el offset Guatemala ya que el RPC también lo usa

Esto asegurará que los totales del detalle coincidan exactamente con los valores de la barra en la gráfica.

