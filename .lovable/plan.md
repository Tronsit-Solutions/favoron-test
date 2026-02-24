

## Eliminar Funnel Viajeros por Canal

Cambio en un solo archivo.

### Cambio

**`src/components/admin/cac/CACAnalysisTab.tsx`**
- Eliminar el componente `<FunnelChart data={channelData} mode="traveler" />` del grid de la seccion de viajeros.
- Cambiar el grid de 2 columnas (`lg:grid-cols-2`) a una sola columna para que la tabla "Metricas por Canal — Viajeros" ocupe todo el ancho.

El componente `FunnelChart` seguira existiendo en el codigo por si se necesita en el futuro, solo se deja de renderizar en esta vista.

