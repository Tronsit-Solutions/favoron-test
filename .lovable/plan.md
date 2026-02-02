
# Plan: Agregar `package_destination_country` a fetchPendingMatchPackages

## Problema Identificado

La función `fetchPendingMatchPackages` en `src/hooks/useAdminData.tsx` (líneas 252-309) es la query específica que alimenta la pestaña "Solicitudes Pendientes de Match".

En la línea 260, el SELECT **no incluye** `package_destination_country`:

```typescript
.select(`
  id, user_id, status, item_description, estimated_price,
  purchase_origin, package_destination, matched_trip_id,  // ❌ Falta package_destination_country
  created_at, updated_at, delivery_deadline, ...
`)
```

## Solución

### Archivo: `src/hooks/useAdminData.tsx`

**Línea 260**: Agregar `package_destination_country` después de `package_destination`:

```typescript
// Antes (línea 260)
purchase_origin, package_destination, matched_trip_id,

// Después
purchase_origin, package_destination, package_destination_country, matched_trip_id,
```

## Resultado Esperado

| Antes | Después |
|-------|---------|
| Destino: Cualquier ciudad | Destino: Guatemala, Cualquier ciudad |
| Destino: Guatemala City | Destino: Guatemala, Guatemala City |

## Resumen

- 1 línea modificada
- La visualización ya está correcta en `PendingRequestsTab.tsx`
- Solo falta traer el dato desde Supabase
