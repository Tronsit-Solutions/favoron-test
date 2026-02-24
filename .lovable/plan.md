

## Agregar CAC por Pedido Pagado

### Que es
Una nueva metrica que calcula cuanto cuesta adquirir cada pedido pagado:

**CAC/Pedido = Inversion Shoppers / Total Paquetes Pagados**

A diferencia del CAC por usuario monetizado (que cuenta usuarios unicos), este mide el costo por cada transaccion individual.

### Cambios tecnicos

**`src/hooks/useCACAnalytics.tsx`**
- Agregar contador `totalPaidPackages` al procesar paquetes (contar cada paquete en `PAID_STATUSES`, no solo usuarios unicos)
- Agregar `cacPerPaidOrder` a la interfaz `ShopperKPIs`: `shopperInvestment / totalPaidPackages`
- Agregar `totalPaidPackages` a `ShopperKPIs`
- Agregar `paidPackages` al channel data para la tabla por canal

**`src/components/admin/cac/CACKPICards.tsx`**
- Agregar una tarjeta "CAC/Pedido" en la fila de Shopper KPIs con el valor calculado

**`src/components/admin/cac/CACTable.tsx`**
- Agregar columna "CAC/Pedido" en modo shopper mostrando el costo por pedido pagado por canal

**`src/components/admin/cac/CACAnalysisTab.tsx`**
- Incluir la nueva metrica en la exportacion Excel

