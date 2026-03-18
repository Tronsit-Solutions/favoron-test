

## Agregar timer de expiración al flujo multi-cotización

### Problema
El `MultiQuoteSelector` recibe `quote_expires_at` en cada assignment pero nunca muestra un `QuoteCountdown`. El shopper no tiene visibilidad de cuánto tiempo le queda para aceptar.

### Solución

**Archivo: `src/components/dashboard/MultiQuoteSelector.tsx`**

1. **Importar `QuoteCountdown`** desde `../QuoteCountdown`

2. **Mostrar timer por cada cotización** dentro de la tarjeta de cada assignment que tenga `quote_expires_at` válido y no expirado. Se renderizará junto al badge de fecha de entrega (esquina superior derecha de cada card), usando el modo `micro={true}` para mantener consistencia con el resto de la app.

3. **Mostrar timer global** (el más próximo a expirar) en la parte superior del selector, debajo del título "Selecciona una cotización", usando `compact={true}` para mayor visibilidad. Esto le da al shopper una referencia rápida del tiempo restante.

4. **Deshabilitar aceptación si la cotización seleccionada expiró**: Si el `quote_expires_at` del assignment seleccionado ya pasó, deshabilitar el botón "Aceptar esta cotización" y mostrar un mensaje de expiración.

### Cambios específicos
- Importar `QuoteCountdown` 
- Calcular el `quote_expires_at` más próximo entre todos los assignments con `bid_submitted`
- Renderizar `QuoteCountdown` global arriba si existe
- Renderizar `QuoteCountdown` micro en cada card junto al badge de fecha
- Agregar validación de expiración al `canAccept`

