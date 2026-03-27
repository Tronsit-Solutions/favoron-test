

## Diagnóstico: Botones de acciones en Órdenes de Reembolso no funcionan

### Causa raíz identificada

Encontré dos problemas que probablemente causan el fallo:

1. **Componente `RefundTable` definido inline (anti-patrón React)**: En `AdminRefundsTab.tsx` línea 98, `RefundTable` se define como una función dentro del render de `AdminRefundsTab`. Esto significa que cada re-render crea una nueva referencia de componente, causando que React desmonte y remonte toda la tabla DOM. Si un re-render ocurre entre el mousedown y mouseup del click, el evento se pierde.

2. **Hook `useAdminRefundOrders` llamado dos veces**: Se llama en `AdminPaymentsUnifiedTab` (línea 18) solo para contar badges, Y de nuevo en `AdminRefundsTab` (línea 40). Cuando el primer hook termina de cargar, causa un re-render del padre, que re-renderiza `AdminRefundsTab`, que recrea `RefundTable` (ver punto 1), potencialmente interrumpiendo clicks en progreso.

3. **Triple nested Radix Tabs**: El componente está dentro de 3 niveles de Tabs anidados (AdminDashboard → AdminPaymentsUnifiedTab → AdminRefundsTab). Los eventos de click pueden propagarse a través de los contextos de Tabs causando comportamiento inesperado.

### Plan de cambios

**Archivo: `src/components/admin/AdminRefundsTab.tsx`**
- Extraer `RefundTable` como un componente separado fuera de `AdminRefundsTab` (moverlo antes del componente principal o a su propio archivo)
- Agregar `e.stopPropagation()` a los onClick de los 3 botones de acción (Eye, Check, X) para prevenir propagación de eventos a través de los Tabs anidados

**Archivo: `src/components/admin/AdminPaymentsUnifiedTab.tsx`**
- Eliminar la llamada duplicada a `useAdminRefundOrders` (línea 18)
- Pasar los conteos de refunds como props desde `AdminRefundsTab` vía callback, o simplemente obtener los conteos directamente del mismo hook que ya usa `AdminRefundsTab`

### Detalle técnico

```text
Antes (anti-patrón):
AdminRefundsTab() {
  const RefundTable = () => <Table>...</Table>  // ← recreado cada render
  return <RefundTable />  // ← React lo trata como componente NUEVO
}

Después (correcto):
const RefundTable = () => <Table>...</Table>  // ← definido una sola vez
AdminRefundsTab() {
  return <RefundTable />  // ← misma referencia siempre
}
```

Para los botones:
```typescript
// Agregar stopPropagation para evitar interferencia con Tabs anidados
onClick={(e) => { e.stopPropagation(); setSelectedRefund(refund); }}
onClick={(e) => { e.stopPropagation(); setActionModal({ type: 'complete', refund }); }}
onClick={(e) => { e.stopPropagation(); setActionModal({ type: 'reject', refund }); }}
```

