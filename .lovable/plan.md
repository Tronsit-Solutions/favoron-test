

## Corregir: El status "matched" se omite del listado de matches

### Problema
En `useMatchFilters.tsx` (línea 16-19), un paquete solo se incluye en la lista de matches si tiene `matched_trip_id` no nulo O si está en `multiAssignedPackageIds`. 

Sin embargo, paquetes con `status = 'matched'` pueden no tener `matched_trip_id` asignado todavía (están en fase de asignación múltiple). La query de Supabase en `useAdminData.tsx` sí los trae (línea 212: `status.in.(matched,quote_sent)`), pero el hook los descarta.

### Cambio

**`src/hooks/useMatchFilters.tsx`** — Línea 19, agregar condición para incluir paquetes con status `matched` o `quote_sent` aunque no tengan `matched_trip_id`:

```tsx
// Antes:
if (hasMatch || isMultiAssigned) {

// Después:
const isMatchStatus = pkg.status === 'matched' || pkg.status === 'quote_sent';
if (hasMatch || isMultiAssigned || isMatchStatus) {
```

Esto asegura que paquetes en estado `matched` aparezcan en la lista y en el dropdown de filtros, incluso si aún no tienen un `matched_trip_id` asignado.

### Archivo
- `src/hooks/useMatchFilters.tsx`

