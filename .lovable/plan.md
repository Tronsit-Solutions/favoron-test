

## Mantener la misma altura de la tarjeta en estado `in_transit` vs `pending_purchase`

### Problema
Cuando un paquete está en `in_transit`, el componente `TravelerPackagePriorityActions` agrega contenido vertical adicional (icono + texto "¿Ya recibiste el paquete?" + botón "Confirmar recibido") que agranda la tarjeta colapsada. En `pending_purchase` este componente retorna `null`, dejando la tarjeta compacta.

### Solución
Hacer el bloque de acción prioritaria más compacto en el estado `in_transit` dentro de la vista colapsada (preview card), manteniendo la misma estructura pero en una sola fila horizontal:

**Cambios en `src/components/dashboard/CollapsibleTravelerPackageCard.tsx`**:
- En el layout desktop (línea ~376), el `TravelerPackagePriorityActions` ya tiene su propio `mb-3` wrapper. Mover el botón "Confirmar recibido" al área derecha junto al badge de status (línea ~510-530) en vez de mostrarlo como bloque separado debajo del título. Esto lo alinea horizontalmente como en la imagen de referencia de `pending_purchase`.

**Cambios en `src/components/dashboard/traveler/TravelerPackagePriorityActions.tsx`**:
- Para `in_transit`: Eliminar el icono circular y reducir el wrapper. Poner el texto y el botón en una sola fila usando `flex items-center justify-between` en vez del layout vertical actual con `space-y-3`.
- Quitar el padding extra del contenedor (`gap-3`, `space-y-3`) y el icono circular decorativo (líneas 53-56).
- Mantener la hint de multi-producto pero más compacta (inline con el texto principal).

### Resultado
La tarjeta en `in_transit` tendrá la misma altura que en `pending_purchase`: una fila con el nombre del producto, el mensaje de estado, y el botón de acción alineado a la derecha.

