

## Fix: Mostrar status real de asignación (bid_lost/bid_expired) en vez del status global del paquete

### Problema
Cuando un viajero pierde un bid o expira, el paquete puede cambiar su status global a `approved` u otro estado. La card del viajero (`TravelerPackageCard`) solo muestra los bloques de `bid_lost`/`bid_expired` cuando `pkg.status === 'matched'`. Como el status global ya cambió, el viajero ve el paquete con un badge incorrecto (ej: "Aprobado") sin contexto de que perdió/expiró.

### Solución — `src/components/dashboard/TravelerPackageCard.tsx`

En la sección "Action buttons / status for travelers" (línea 202), cambiar la condición para que también muestre los bloques de assignment status cuando hay un `_assignmentStatus` terminal:

```ts
// Antes:
{pkg.status === 'matched' && (

// Después:
{(pkg.status === 'matched' || ['bid_lost', 'bid_expired', 'bid_cancelled'].includes(pkg._assignmentStatus)) && (
```

### Solución — `src/components/dashboard/getStatusBadge` (o donde se genera el badge)

Agregar lógica para que cuando `_assignmentStatus` sea `bid_lost`, `bid_expired`, o `bid_cancelled`, el badge refleje eso en lugar del status global del paquete. Buscar dónde se llama `getStatusBadge` y anteponer:

```ts
// Si es multi-assignment con status terminal, mostrar badge de asignación
if (pkg._assignmentStatus === 'bid_expired') → Badge "⏰ Expirado" (variant warning)
if (pkg._assignmentStatus === 'bid_lost') → Badge "❌ No seleccionado" (variant destructive)
if (pkg._assignmentStatus === 'bid_cancelled') → Badge "Cancelado" (variant muted)
```

Esto se puede hacer en el componente `TravelerPackageCard` directamente, overrideando el badge del header cuando aplique.

### Archivos
- **Modificar**: `src/components/dashboard/TravelerPackageCard.tsx` — condición de render + override de badge para statuses terminales

