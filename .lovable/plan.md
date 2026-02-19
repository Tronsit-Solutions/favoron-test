

## Fix: El boton de "ver detalles" (ojo) no abre ningun modal en UserPackagesTab

### Problema
En `src/components/admin/UserPackagesTab.tsx`, el handler `handleViewDetails` solo hace `setSelectedPackage(pkg)` pero **no hay ningun modal/dialog renderizado** en el componente que use ese estado. El estado se actualiza pero no hay UI que lo muestre.

Lo mismo pasa con `handleEditPackage` y `handleViewDocument` - son funciones vacias con comentarios "would be implemented here".

### Solucion
Importar y renderizar el `ProductDetailsModal` (que ya existe en `src/components/dashboard/ProductDetailsModal.tsx`) cuando `selectedPackage` no es null.

### Cambios

**Archivo: `src/components/admin/UserPackagesTab.tsx`**

1. Importar `ProductDetailsModal`:
```typescript
import ProductDetailsModal from "@/components/dashboard/ProductDetailsModal";
```

2. Agregar el modal al final del JSX (antes del cierre del fragment o div principal), usando `selectedPackage` como datos:
```tsx
{selectedPackage && (
  <ProductDetailsModal
    isOpen={!!selectedPackage}
    onClose={() => setSelectedPackage(null)}
    pkg={selectedPackage}
  />
)}
```

Esto conecta el estado existente (`selectedPackage`) con el modal existente (`ProductDetailsModal`), sin necesidad de crear componentes nuevos.

