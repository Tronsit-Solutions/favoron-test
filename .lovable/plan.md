

## Eliminar badge de status duplicado en mobile

En la línea 312 de `CollapsibleTravelerPackageCard.tsx`, se renderiza `<TravelerPackageStatusBadge status={...} pkg={pkg} />` en la esquina derecha del header. Esta info ya está en el botón "Ver detalle" de las líneas 324-341.

### Cambio

**`src/components/dashboard/CollapsibleTravelerPackageCard.tsx`** — Eliminar la línea 312 (`<TravelerPackageStatusBadge status={getEffectiveStatus(pkg)} pkg={pkg} />`), dejando solo el botón compacto que abre el modal.

