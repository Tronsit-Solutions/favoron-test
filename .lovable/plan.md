

## Abrir detalle de ratings al hacer click en el card de Rating Global

### Enfoque
Agregar un `Dialog` al `PlatformRatingCard` que se abra al hacer click en el card. El dialog mostrará el componente `AdminPlatformReviewsTab` ya existente, que contiene KPIs y la tabla detallada de reviews.

### Cambios en `src/components/admin/charts/PlatformRatingCard.tsx`:
1. Importar `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` y `AdminPlatformReviewsTab`
2. Agregar estado `open` para controlar el dialog
3. Hacer el `Card` clickeable con `cursor-pointer` y `onClick` para abrir el dialog
4. Renderizar un `Dialog` con `max-w-5xl` que contenga `AdminPlatformReviewsTab` con scroll interno

El card existente no cambia visualmente, solo se vuelve clickeable. Al hacer click se abre un modal grande con toda la información detallada de las reseñas.

