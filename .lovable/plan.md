

## Optimizar cards de pedidos en móvil (Shopper)

### Cambios en `src/components/dashboard/CollapsiblePackageCard.tsx`

**1. Reemplazar precio por ID del pedido (línea 429)**
- Cambiar `getPackageDescription()` (que muestra "Precio: $XX") por el ID corto del paquete: `ID: ${pkg.id.substring(0, 8)}`

**2. Status alineado a la izquierda**
- Ya está alineado a la izquierda (`pl-5`), no requiere cambios.

**3. Tres puntos siempre en esquina superior derecha**
- Ya está posicionado con `absolute top-2 right-2`. No requiere cambios.

**4. Botón de chat siempre a la derecha del card**
- Mover el botón de chat de su posición actual (líneas 407-416, `absolute top-1 right-9` junto al badge de notificación) a una posición fija en la derecha del card header.
- Sacarlo del bloque actual y colocarlo como elemento absoluto independiente, posicionado `absolute top-3 right-10` (a la izquierda de los 3 puntos), visible siempre que `isChatAvailable` sea true.
- El `NotificationBadge` se mantiene en la misma zona.

