

## Cambiar de Dialog a Sheet lateral ancho

### Cambio

**`src/components/admin/charts/RevenueDetailSheet.tsx`**:
- Reemplazar `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle`/`DialogDescription` por `Sheet`/`SheetContent`/`SheetHeader`/`SheetTitle`/`SheetDescription`
- Usar `side="right"` con clase personalizada para hacerlo más ancho (`!max-w-2xl w-full`)
- Mantener todo el contenido interno (summary cards, tabla) igual, solo ajustar el contenedor

