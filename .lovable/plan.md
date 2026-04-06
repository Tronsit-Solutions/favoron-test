

## Mostrar nombres de viajeros con estado del bid en el preview de MatchCard

### Qué cambia

Donde actualmente dice "🤝 2 viajeros asignados ✈️" (tanto en mobile como desktop), se reemplaza por una lista compacta de los nombres de los viajeros con un icono indicando el estado de su bid:
- ⏳ `bid_pending` — pendiente
- ✅ `bid_submitted` — bid enviado  
- ❌ `bid_expired` — expirado

Ejemplo visual: `🤝 Ana G. ✅ • Luis R. ⏳`

### Cambios necesarios

**1. `src/components/admin/AdminMatchingTab.tsx` — Enriquecer el fetch de assignments**

La query actual solo trae campos de `package_assignments`. Necesitamos hacer un join con `trips` para obtener el `user_id` del viajero, y luego un segundo fetch (o join) a `profiles` para los nombres.

Opción más simple: agregar al select un join a trips y profiles:
```sql
select('id, package_id, trip_id, status, ..., trips!inner(user_id, profiles!inner(first_name, last_name))')
```

Esto traerá `assignment.trips.profiles.first_name` y `last_name` en cada assignment.

**2. `src/components/admin/matching/MatchCard.tsx` — Reemplazar "X viajeros asignados"**

En las 3 ubicaciones donde se muestra `{assignmentInfo.count} viajeros asignados`:
- Líneas ~285-288 (mobile, bloque sin matchedTrip)
- Líneas ~308-311 (desktop, bloque sin matchedTrip)

Reemplazar con un componente inline que itere `assignmentInfo.assignments` y muestre:
- Nombre del viajero (First Name + inicial del apellido)
- Icono de estado del bid al lado

**3. Interfaz `assignmentInfo`** — Actualizar el tipo para reflejar que cada assignment ahora incluye datos del viajero anidados.

### Archivos a modificar
- `src/components/admin/AdminMatchingTab.tsx` — enriquecer query de assignments con join a trips→profiles
- `src/components/admin/matching/MatchCard.tsx` — reemplazar texto genérico por lista de nombres con iconos de estado

