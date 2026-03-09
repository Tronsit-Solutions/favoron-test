

## Mover notificación fuera del botón de chat en móvil

### Problema
En móvil, el `NotificationBadge` está sobre el ícono de chat (`MessageCircle`), lo que hace parecer que hay un mensaje nuevo de chat pendiente. En realidad indica que el paquete requiere acción del shopper.

### Solución
Quitar el `NotificationBadge` del botón de chat en móvil (líneas 413-415) y moverlo junto al badge de status, donde ya existe en la vista desktop (línea 730). Así queda claro que es una notificación del estado del paquete.

### Cambio en `src/components/dashboard/CollapsiblePackageCard.tsx`

**Líneas 413-415** — Eliminar el `NotificationBadge` del wrapper del chat button:
```tsx
// Eliminar estas líneas:
{needsAction && (
  <NotificationBadge count={1} className="absolute -top-1 -right-1" />
)}
```

**Línea ~443 (zona del status badge en móvil)** — Agregar el badge junto al status:
```tsx
<div className="flex items-center gap-2">
  {getStatusBadge(...)}
  {needsAction && <NotificationBadge count={1} />}
  ...
</div>
```

