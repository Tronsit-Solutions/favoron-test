
# Plan: Agregar `package_destination_country` a PendingRequestsTab

## Problema

En `src/components/admin/matching/PendingRequestsTab.tsx`, línea 302, solo se muestra la ciudad de destino:

```tsx
<p className="text-xs text-blue-600 mt-1">
  📦 Origen: {pkg.purchase_origin || 'No especificado'} → 🎯 Destino: {pkg.package_destination || 'Guatemala'}
</p>
```

## Solución

### Archivo: `src/components/admin/matching/PendingRequestsTab.tsx`

1. **Agregar import** (línea ~15):
```tsx
import { getCountryLabel } from "@/lib/countries";
```

2. **Modificar línea 302** para mostrar país + ciudad:
```tsx
<p className="text-xs text-blue-600 mt-1">
  📦 Origen: {pkg.purchase_origin || 'No especificado'} → 🎯 Destino: {pkg.package_destination_country 
    ? `${getCountryLabel(pkg.package_destination_country) || pkg.package_destination_country}, ${pkg.package_destination}`
    : pkg.package_destination || 'Guatemala'}
</p>
```

## Resultado Esperado

| Antes | Después |
|-------|---------|
| Destino: Cualquier ciudad | Destino: Guatemala, Cualquier ciudad |
| Destino: Guatemala City | Destino: Guatemala, Guatemala City |
| Destino: Miami | Destino: Estados Unidos, Miami |

## Nota

El campo `package_destination_country` ya está disponible porque lo agregamos a la query `fetchPendingApprovalPackages` en el paso anterior.
