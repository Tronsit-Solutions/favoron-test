

## Optimizar carga de asignaciones del viaje

### Problema
Cuando haces click en un viajero, `handleTravelerClick` dispara 3 queries paralelas, pero:
1. **Waterfall interno**: `packagesPromise` hace una query inicial y luego otra query secuencial para bidding packages (líneas 628-688)
2. **Join anidado pesado**: La query de assignments (línea 700-707) hace un join `package_assignments → packages → profiles`, que PostgREST resuelve como múltiples sub-queries
3. **Sin caché**: Cada click en el mismo viajero re-ejecuta todo desde cero
4. **Sin timeout**: Si Supabase tarda, no hay límite — puede colgar indefinidamente

### Solución

**Archivo**: `src/components/admin/AdminMatchDialog.tsx`

#### 1. Aplanar la query de assignments
Separar el join anidado en dos queries simples ejecutadas en paralelo:
- Query 1: `package_assignments` con solo `id, package_id, status, admin_assigned_tip, quote, created_at` filtrado por `trip_id`
- Query 2: Fetch de los packages correspondientes con sus profiles usando los `package_id`s del resultado anterior

Esto evita el join de 3 niveles que PostgREST resuelve lentamente.

#### 2. Eliminar el waterfall en packagesPromise
Actualmente la query de bidding packages (línea 668-687) espera a que terminen las queries directas. Reorganizar para que las 3 queries base corran en un solo `Promise.all`:
- Direct packages
- Assignment package_ids (ya existe)
- Assignments completas

Y luego hacer el fetch de bidding packages como paso 2, usando los IDs ya disponibles.

#### 3. Agregar caché por trip
Usar un `Map<tripId, data>` en un ref para evitar re-fetches al hacer click en el mismo viajero repetidamente. Invalidar al hacer un match.

#### 4. Agregar timeout de seguridad
Envolver las queries en un `Promise.race` con un timeout de 10 segundos. Si expira, mostrar los datos parciales que ya se tengan y un mensaje de "carga parcial".

### Resultado esperado
- Reducción de latencia de 10+ segundos a 2-3 segundos
- Clicks repetidos al mismo viajero son instantáneos (caché)
- Nunca se queda colgado indefinidamente (timeout)

