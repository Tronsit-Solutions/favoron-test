

## Clarificar precios en el modal de cotizaciones

### Problema
La tarjeta del viajero muestra `Q175.00` (totalPrice del quote, que incluye delivery fee), pero el "Total a pagar" muestra `Q150.00` cuando el shopper elige pickup. No queda claro qué incluye cada número.

### Solución

**Archivo: `src/components/dashboard/MultiQuoteSelector.tsx`**

#### 1) En la tarjeta del viajero (línea 353): mostrar precio SIN delivery fee
Cambiar de `quoteValues.totalPrice` a `quoteValues.price + quoteValues.serviceFee` (el subtotal Favorón). Así la tarjeta muestra el precio base comparable entre viajeros, sin que el delivery fee confunda.

Opcionalmente agregar una línea pequeña debajo: `"+ envío según método"` en texto muted.

#### 2) En la sección "Total a pagar" (líneas 517-525): mostrar desglose
Expandir el bloque para mostrar:
```
Subtotal (tip + comisión):     Q150.00
Envío:                         Gratis / Q25.00
─────────────────────────────────────
Total a pagar:                 Q150.00 / Q175.00
```

Usar `recalculatedTotal.basePrice + recalculatedTotal.serviceFee` para el subtotal y `recalculatedTotal.deliveryFee` para el envío, con el total final ya calculado en `displayTotal`.

### Resultado
- La tarjeta muestra el costo real del servicio (sin delivery fee)
- El desglose en "Total a pagar" deja claro cuánto es envío vs. servicio
- El shopper entiende exactamente cómo cambia el total al elegir pickup vs. delivery

