

## Reemplazar descripción de status por botón + modal en móvil (Shopper)

Mismo patrón que se aplicó en `CollapsibleTravelerPackageCard`: en la vista móvil del `CollapsiblePackageCard.tsx`, reemplazar el texto de `getStatusDescription(pkg)` por un botón compacto que abre un Dialog con la descripción completa.

### Cambios en `src/components/dashboard/CollapsiblePackageCard.tsx`

1. **Agregar estado** `showStatusModal` (línea ~93, junto a los otros estados)
2. **Línea 429** — Reemplazar `<span className="block break-words max-w-full">{getStatusDescription(pkg)}</span>` por un botón compacto con el badge del status + texto "Ver detalle" que abre el modal
3. **Agregar Dialog** al final del componente que muestre `getStatusDescription(pkg)` completo junto con `getStatusBadge(pkg.status)` dentro de un modal

El botón usará el mismo estilo que en el traveler card: `variant="outline"`, tamaño pequeño, con el badge de status y "Ver detalle".

