
## Corregir flujo de feedback: no marcar como completado hasta calificar a Favoron

### Problema
Despues de calificar al viajero, el boton amarillo "Calificar viajero" desaparece porque `needsFeedback` se vuelve `false` al encontrar un `existingRating`. Esto hace que el usuario pierda acceso al flujo de calificacion de Favoron si cierra el modal sin completarlo.

El flag `feedback_completed` en la base de datos no se marca prematuramente (solo se marca al enviar la resena de plataforma o al dar "Omitir"). Sin embargo, el boton desaparece visualmente del card, lo cual impide re-abrir el flujo.

### Solucion
Cambiar la logica de `needsFeedback` para que sea `true` mientras falte CUALQUIERA de las dos calificaciones (viajero O plataforma), y ajustar el boton para reflejar el paso actual.

### Cambios tecnicos

**Archivo: `src/components/dashboard/CollapsiblePackageCard.tsx`**

1. Agregar una query para verificar si ya existe `platform_review` para el paquete (similar a la de `existingRating`)
2. Cambiar `needsFeedback` a:
   ```
   const needsFeedback = pkg.status === 'completed' 
     && pkg.feedback_completed !== true 
     && (!existingRating || !existingPlatformReview);
   ```
3. Cambiar el texto y comportamiento del boton amarillo:
   - Si NO existe `existingRating`: mostrar "Calificar viajero" (abre TravelerRatingModal)
   - Si existe `existingRating` pero NO existe `existingPlatformReview`: mostrar "Calificar Favoron" (abre PlatformReviewModal directamente)
4. Aplicar esto tanto en la version mobile como desktop del boton

**Archivo: `src/components/dashboard/shopper/ShopperPackagePriorityActions.tsx`**
- No requiere cambios, ya maneja el flujo secuencial correctamente con sus propias queries
