

## Fix: Auto-scroll al expandir filas de ordenes de pago

### Problema
Al hacer clic en el chevron para expandir los detalles de una orden de pago, la pagina se desplaza automaticamente hacia arriba. Esto ocurre porque el componente `CompactOrderRow` esta definido **dentro** de `AdminTravelerPaymentsTab` (linea 230), lo que significa que React lo recrea en cada render. Cuando se actualiza `expandedRows`, React desmonta y remonta todas las filas de la tabla, perdiendo la posicion del scroll.

### Solucion

**Archivo: `src/components/admin/AdminTravelerPaymentsTab.tsx`**

1. **Mover `CompactOrderRow` fuera del componente padre** - Extraer `CompactOrderRow` como un componente independiente fuera de `AdminTravelerPaymentsTab`, pasando las dependencias necesarias como props (`expandedRows`, `toggleRowExpansion`, `updatePaymentOrder`, `setConfirmDialog`, `setSelectedOrder`, `toast`, `maskAccount`).

2. **Hacer lo mismo con `EditableNotesSection` y `OrderDetailModal`** - Estos tambien estan definidos dentro del componente padre y deben extraerse.

3. De esta forma, React podra reconciliar los componentes correctamente usando las `key` existentes (`order.id`) sin necesidad de desmontarlos y remontarlos.

### Detalle tecnico

El problema raiz es que cuando un componente se define dentro de otro componente con `const CompactOrderRow = ...` dentro del cuerpo de la funcion:
- Cada re-render crea una **nueva referencia** de la funcion del componente
- React interpreta esto como un **componente diferente** y desmonta el anterior
- Al desmontar/remontar toda la tabla, el navegador pierde la posicion del scroll

La solucion es mover estas definiciones fuera del scope del componente padre, o alternativamente usar `useCallback`/`useMemo`, pero la forma idiomatica en React es simplemente definirlos fuera.

