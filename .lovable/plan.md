

## Fix: Paquetes con bid_lost/bid_expired/bid_cancelled van a "Pendientes"

### Problema
La clasificación Confirmados/Pendientes (línea 982-984 de `Dashboard.tsx`) usa solo el `status` del paquete. El iPhone 15 Pro tiene `status: pending_purchase` → cae en `CONFIRMED_STATUSES`, pero su asignación es `bid_lost`, así que debería estar en Pendientes.

### Cambio

**`src/components/Dashboard.tsx` (líneas 982-984)**

Agregar condición: si `_assignmentStatus` es `bid_lost`, `bid_expired`, o `bid_cancelled`, el paquete va a Pendientes independientemente de su status:

```tsx
const TERMINAL_ASSIGNMENTS = ['bid_lost', 'bid_expired', 'bid_cancelled'];
const confirmedPackages = tripPackages.filter(pkg => 
  CONFIRMED_STATUSES.includes(pkg.status) && !TERMINAL_ASSIGNMENTS.includes(pkg._assignmentStatus)
);
const pendingPackages = tripPackages.filter(pkg => 
  !CONFIRMED_STATUSES.includes(pkg.status) || TERMINAL_ASSIGNMENTS.includes(pkg._assignmentStatus)
);
```

### Archivo
- `src/components/Dashboard.tsx`

