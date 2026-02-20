
## Reordenar opciones de condicion del producto

### Cambio
En `src/components/dashboard/TravelerRatingModal.tsx`, reordenar las opciones del RadioGroup de condicion del producto para que vayan de izquierda a derecha: Mal, Regular, Bien (de peor a mejor).

### Detalle tecnico
- **Archivo**: `src/components/dashboard/TravelerRatingModal.tsx`
- **Lineas ~97-109**: Mover el bloque de "bad" (Mal) al primer lugar, dejar "fair" (Regular) en el medio, y "good" (Bien) al final
- Orden actual: Bien - Regular - Mal
- Orden nuevo: Mal - Regular - Bien
