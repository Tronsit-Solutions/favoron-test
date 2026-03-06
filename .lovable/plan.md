

## Cambiar modal de reviews a Sheet (hoja lateral)

### Cambio

**`src/components/admin/charts/PlatformRatingCard.tsx`**:
- Reemplazar `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle` por `Sheet`/`SheetContent`/`SheetHeader`/`SheetTitle`
- Usar `side="right"` con ancho amplio para mostrar la tabla cómodamente
- Clase personalizada para ancho máximo mayor (`sm:max-w-5xl w-full`)

