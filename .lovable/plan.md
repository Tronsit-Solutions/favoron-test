

## Hacer visible el campo de Tip Boost en Step 4

El campo de Boost Code existe (línea 1426) pero está debajo del cuadro informativo "¿Cómo funciona para viajeros?", casi al final del formulario. En la captura se ve que el usuario tiene que hacer mucho scroll para llegar a él.

### Cambio

**`src/components/TripForm.tsx`**: Mover el bloque del Boost Code (líneas 1426-1441) hacia arriba, colocándolo **justo después del resumen del viaje y antes del cuadro informativo** (antes de línea 1404). Así será visible sin necesidad de hacer scroll adicional.

