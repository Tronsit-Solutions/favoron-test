
# Plan: Agregar `package_destination_country` a la Consulta Admin

## Problema Identificado

En `src/hooks/useAdminData.tsx`, línea 97-105, la consulta de paquetes **no incluye** el campo `package_destination_country`:

```tsx
.select(`
  id, user_id, status, item_description, estimated_price,
  purchase_origin, package_destination, matched_trip_id,
  // ❌ package_destination_country NO ESTÁ AQUÍ
  ...
`)
```

Por esto, en `AdminApprovalsTab.tsx`, cuando el código intenta mostrar:
```tsx
pkg.package_destination_country 
  ? `${getCountryLabel(pkg.package_destination_country)}...`
  : pkg.package_destination
```

El valor de `pkg.package_destination_country` es `undefined` (no fue cargado), y solo muestra el fallback `pkg.package_destination` = "Cualquier ciudad".

## Solución

### Archivo: `src/hooks/useAdminData.tsx`

**Línea 98**: Agregar el campo faltante

```tsx
// Antes (línea 98):
purchase_origin, package_destination, matched_trip_id,

// Después:
purchase_origin, package_destination, package_destination_country, matched_trip_id,
```

## Resultado Esperado

| Antes | Después |
|-------|---------|
| Destino: Cualquier ciudad | Destino: Guatemala, Cualquier ciudad |
| Destino: Miami | Destino: Estados Unidos, Miami |

## Alcance del Cambio

- Solo 1 línea en 1 archivo
- No afecta la lógica de display (ya está implementada correctamente en AdminApprovalsTab.tsx)
