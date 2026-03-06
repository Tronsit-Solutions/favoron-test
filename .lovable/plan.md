

## Fix: Paginar queries en useAcquisitionAnalytics

### Problema
`useAcquisitionAnalytics.tsx` tiene el mismo problema que tenía `useCACAnalytics`: las queries a `profiles` y `packages` están limitadas a 1000 rows por el default de Supabase (`PGRST_MAX_ROWS`). Por eso solo se procesan ~1000 usuarios y ~1000 paquetes, resultando en un service fee total muy bajo.

### Solución
Aplicar la misma función `fetchAllPaginated` que ya se creó en `useCACAnalytics.tsx`:

**`src/hooks/useAcquisitionAnalytics.tsx`**
- Copiar la función `fetchAllPaginated` (o importarla de un util compartido)
- Refactorear ambas queries (`profiles` y `packages`) para usar `.range(from, to)` con paginación automática en bloques de 1000
- Esto garantiza que se procesen todos los registros sin límite

