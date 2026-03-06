

## Cambios para `pending_office_confirmation`

### 1. `src/components/dashboard/TripPackagesGroup.tsx` y `src/components/Dashboard.tsx`
- Excluir `pending_office_confirmation` de la lista que determina `hasPendingAction`, para que la tarjeta no se resalte en celeste. Cambiar de `['matched', 'pending_office_confirmation']` a solo `['matched']`.

### 2. `src/components/dashboard/traveler/TravelerPackagePriorityActions.tsx`
- Para `pending_office_confirmation`, retornar `null` en lugar de renderizar el botón "Ver dirección de oficina". El early return en línea 24-42 se reemplaza por `return null`.

### 3. `src/components/dashboard/TripPackagesGroup.tsx` (métrica `hasPendingActions` del trip)
- También excluir `pending_office_confirmation` de la condición que resalta el trip card padre (línea 45), dejando solo `['matched', 'in_transit']`.

### Resultado
- La tarjeta en estado `pending_office_confirmation` se verá neutra (fondo gris sutil, sin borde celeste ni notificación).
- Se elimina el botón "Ver dirección de oficina" de ese estado.

