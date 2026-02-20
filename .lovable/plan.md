

## Mostrar boton "Calificar viajero" en la tarjeta colapsada

### Problema actual
Cuando un paquete esta en status `completed` con `feedback_completed = false`, el boton de "Calificar viajero" solo aparece al expandir la tarjeta. El usuario no sabe que tiene feedback pendiente sin expandir.

### Solucion
Agregar un boton "Calificar viajero" directamente en la preview (tarjeta colapsada) del `CollapsiblePackageCard`, visible tanto en mobile como en desktop cuando el paquete esta completado y el feedback no se ha dado.

### Cambios tecnicos

**Archivo: `src/components/dashboard/CollapsiblePackageCard.tsx`**

1. Importar `TravelerRatingModal` y `Star` (icono) al inicio del archivo
2. Agregar estado `showTravelerRatingFromPreview` para controlar el modal desde la preview
3. En la seccion mobile (lineas ~542-595), despues de los botones de accion existentes, agregar una condicion:
   - Si `pkg.status === 'completed'` y `pkg.feedback_completed !== true`, mostrar un boton "Calificar viajero" con icono de estrella
   - El boton abre directamente el `TravelerRatingModal`
4. En la seccion desktop (lineas ~598+), agregar el mismo boton con la misma logica
5. Renderizar el `TravelerRatingModal` junto a los otros modales al final del componente, con un callback `onRefresh` que recargue los datos

El boton se mostrara con `variant="success"` y estilo similar a los demas botones de accion en la preview, con el texto "Calificar viajero" y un icono de estrella.

