

## Eliminar Funnel Shoppers por Canal

Cambio sencillo en un solo archivo.

### Cambio

**`src/components/admin/cac/CACAnalysisTab.tsx`**
- Eliminar el componente `<FunnelChart data={channelData} mode="shopper" />` del grid de la primera fila (donde estan Gestion de Inversiones, Costos de Incidencias y el Funnel).
- Cambiar el grid de 3 columnas (`lg:grid-cols-3`) a 2 columnas (`lg:grid-cols-2`) para que las dos cards restantes se distribuyan mejor.

El funnel de viajeros que aparece mas abajo se mantiene sin cambios.

