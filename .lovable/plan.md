

## Agregar botón "Descartar" para bid_lost y bid_expired en CollapsibleTravelerPackageCard

### Problema
Las tarjetas con `_assignmentStatus` de `bid_lost`, `bid_expired` o `bid_cancelled` muestran el estado correcto pero no tienen botón para descartarlas. El viajero no puede limpiar su dashboard.

### Solución
Agregar un botón "Descartar" inline debajo del mensaje de estado para estos tres casos terminales, usando la misma lógica que ya existe en `TravelerPackageCard.tsx`: actualizar `dismissed_by_traveler = true` en `package_assignments` usando `pkg._assignmentId`.

### Cambios

**1. `src/components/dashboard/CollapsibleTravelerPackageCard.tsx`**

- Agregar estado `dismissing` (boolean) y importar `useToast`
- Agregar función `handleDismissAssignment` que:
  - Hace `supabase.from('package_assignments').update({ dismissed_by_traveler: true }).eq('id', pkg._assignmentId)`
  - Muestra toast de confirmación
  - Recarga la página (`window.location.reload()`) para que el filtro en Dashboard.tsx (línea 290) lo excluya
- En las líneas 408-413, después de cada mensaje de estado (`bid_lost`, `bid_expired`, `bid_cancelled`), agregar un `<Button>` ghost pequeño con icono X y texto "Descartar de mi dashboard"

El resultado visual será idéntico al que ya existe en `TravelerPackageCard.tsx` (el componente legacy), pero dentro del componente colapsable usado en Mis Viajes.

