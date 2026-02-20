

## Corregir error de calificacion duplicada

### Problema
El error "duplicate key value violates unique constraint traveler_ratings_package_id_key" indica que el usuario ya califico este paquete pero el boton sigue apareciendo. Hay una restriccion UNIQUE en `package_id` en la tabla `traveler_ratings`, lo cual es correcto, pero falta:

1. Verificar si ya existe una calificacion antes de mostrar el boton
2. Manejar el error gracefully si ocurre de todas formas

### Cambios tecnicos

**Archivo: `src/components/dashboard/CollapsiblePackageCard.tsx`**
- Modificar la variable `needsFeedback` para que tambien consulte si ya existe un `traveler_rating` para ese paquete
- Usar una query con `useQuery` para verificar si existe rating: `SELECT id FROM traveler_ratings WHERE package_id = pkg.id`
- Si ya existe rating, `needsFeedback` sera `false` y el boton no se mostrara

**Archivo: `src/components/dashboard/TravelerRatingModal.tsx`**
- Agregar manejo del error de duplicado: si el error contiene "duplicate key" o "unique constraint", mostrar un toast informativo diciendo "Ya calificaste a este viajero" en vez del mensaje de error generico
- Despues del error de duplicado, cerrar el modal y llamar `onSuccess()` para que el flujo continue al review de plataforma

**Archivo: `src/components/dashboard/shopper/ShopperPackagePriorityActions.tsx`**
- Aplicar la misma logica de verificacion para no mostrar el boton de calificar si ya existe rating

