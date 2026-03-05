

## Agregar icono de chat en la preview card del paquete

### Problema
Actualmente para acceder al chat, el usuario debe expandir la card y luego navegar a la pestaña "Chat". Se quiere un acceso directo desde la card colapsada.

### Plan

**Modificar `CollapsiblePackageCard.tsx`**:

1. Definir los estados donde el chat está disponible (post-pago): `pending_purchase`, `in_transit`, `received_by_traveler`, `pending_office_confirmation`, `delivered_to_office`, `completed`.

2. **Desktop** (linea ~960, junto al status badge): Agregar un botón `MessageCircle` antes del badge de status. Al hacer click, expandir la card (`setIsOpen(true)`) y cambiar a tab chat (`setActiveTab("chat")`).

3. **Mobile** (linea ~395, junto al notification badge): Agregar el mismo icono de chat en la esquina superior derecha de la card (al lado del badge de notificación y el menú de 3 puntos). Mismo comportamiento: expandir + ir a tab chat.

El botón será un `Button ghost` con el icono `MessageCircle` y `stopPropagation` para no triggerar el collapsible.

### Archivos a modificar
- `src/components/admin/CollapsiblePackageCard.tsx` — No, es `src/components/dashboard/CollapsiblePackageCard.tsx`
- Opcionalmente `src/components/dashboard/CollapsibleTravelerPackageCard.tsx` si el viajero también tiene tab de chat

