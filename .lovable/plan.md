

## Quitar borde celeste y mover NotificationBadge a esquina superior izquierda

### Contexto
El borde celeste (`ring-2 ring-primary/50 border-primary/20`) aparece cuando `needsAction` es `true`, es decir en los statuses: `quote_sent`, `quote_accepted`, `payment_pending`, `payment_pending_approval`, `pending_purchase`. Siempre que el shopper tiene algo pendiente por hacer.

### Cambios en `src/components/dashboard/CollapsiblePackageCard.tsx`

**1. Eliminar el borde celeste resaltado (línea 358):**
Quitar `ring-2 ring-primary/50 shadow-lg border-primary/20` del condicional `needsAction`. Solo mantener `hover:shadow-md` para todos.

**2. Mover NotificationBadge a esquina superior izquierda del card:**
- Eliminar el `NotificationBadge` de su ubicación actual junto al "Ver detalle" (línea 443) y del desktop (línea 728).
- Agregar el `NotificationBadge` como hijo directo del `Card` wrapper, posicionado con `absolute -top-2 -left-2 z-10` para que se salga un poco del card. El `Card` necesita `relative` en su className.

```text
┌──────────────────────┐
🔴                      │  ← badge sale del card
│  Pedido de 3 prod... │
│  Cotización Pagada   │
└──────────────────────┘
```

