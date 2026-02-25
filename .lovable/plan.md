

## Fix: Puntualidad se muestra multiplicada por 100 dos veces

### Problema
El trigger SQL `update_traveler_rating_stats` guarda `traveler_ontime_rate` ya como porcentaje (e.g., `100.0` = 100%). Pero el frontend en `AdminTravelersTab.tsx` lo multiplica por 100 otra vez, resultando en "10000%" y "5000%".

Lo mismo pasa en `UserDetailModal.tsx` pero ahí NO multiplica por 100 (muestra `100%` correcto), así que solo hay inconsistencia en `AdminTravelersTab.tsx`.

### Cambios

**`src/components/admin/AdminTravelersTab.tsx`**
- Línea 135 (KPI card): cambiar `{(avgOntime * 100).toFixed(0)}%` → `{avgOntime.toFixed(0)}%`
- Línea 223 (tabla por fila): cambiar `{(Number(t.traveler_ontime_rate) * 100).toFixed(0)}%` → `{Number(t.traveler_ontime_rate).toFixed(0)}%`

Son dos cambios de una línea cada uno. No se requieren migraciones ni cambios de schema.

