
# Plan: Agregar `package_destination_country` a fetchPendingApprovalPackages

## Problema

La query en `fetchPendingApprovalPackages` (línea 320) **NO incluye** el campo `package_destination_country`:

```tsx
// Línea 318-320 actual:
.select(`
  id, user_id, status, item_description, estimated_price,
  purchase_origin, package_destination, matched_trip_id,  // ❌ Falta package_destination_country
  ...
`)
```

Esta es la función específica que carga los paquetes para la pestaña de aprobaciones pendientes, por eso no se ve el país aunque lo agregamos a la otra query general.

## Solución

### Archivo: `src/hooks/useAdminData.tsx`

**Línea 320**: Agregar `package_destination_country` después de `package_destination`:

```tsx
// Antes
purchase_origin, package_destination, matched_trip_id,

// Después
purchase_origin, package_destination, package_destination_country, matched_trip_id,
```

## Resultado Esperado

| Antes | Después |
|-------|---------|
| Destino: Guatemala City | Destino: Guatemala, Guatemala City |
| Destino: Cualquier ciudad | Destino: Guatemala, Cualquier ciudad |

## Alcance

- 1 línea en 1 archivo
- No afecta otras funcionalidades
