

## Agregar botón "Volver" en la segunda hoja del modal de aceptación (trip confirmation)

### Problema
Cuando el viajero acepta un paquete, el modal tiene dos pasos:
1. **Paso 1**: Detalles del producto, tip, etc.
2. **Paso 2**: Confirmación de información de viaje (`showTripConfirmation = true`)

En el paso 2 no hay forma de regresar al paso 1 para revisar los detalles del producto/tip.

### Solución — `src/components/QuoteDialog.tsx`

En la sección de "Action Buttons" del trip confirmation step (línea ~875), agregar un botón "Volver" que haga `setShowTripConfirmation(false)`:

**Cambiar** el layout de botones (líneas 875-893) para incluir un botón de regreso:

```
[← Volver]  [Editar viaje]  [Confirmar y enviar]
```

- Agregar un botón con ícono `ArrowLeft` que ejecute `setShowTripConfirmation(false)`
- Ajustar el layout a 3 botones: "Volver" (ghost/outline pequeño), "Editar viaje" (outline), "Confirmar y enviar" (success)
- En mobile, usar layout de 2 filas: "Volver" arriba solo, y los otros 2 abajo

### Archivo
- **Modificar**: `src/components/QuoteDialog.tsx` — sección de botones del trip confirmation step (~línea 875)

