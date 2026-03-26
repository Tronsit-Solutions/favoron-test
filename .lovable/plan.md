

## Fix: Total a Pagar incorrecto en tabla financiera

### Problema
El `totalPrice` guardado en el JSONB de la cotización está desactualizado en algunos paquetes. Cuando se recalculó el `serviceFee` para usuarios Prime, no se actualizó el `totalPrice` correspondiente. Ejemplo: Edison Castillo tiene tip=210 + serviceFee=42 + delivery=0 = **252**, pero `totalPrice` dice **294**.

`getQuoteValues()` lee `totalPrice` directo de la DB y lo usa para calcular `finalTotalPrice`, propagando el error a la tabla financiera y a cualquier otro lugar que use esta función.

### Solución
Modificar `getQuoteValues()` en `src/lib/quoteHelpers.ts` para **recalcular** `totalPrice` como la suma de sus componentes (`price + serviceFee + deliveryFee`) en lugar de confiar en el valor guardado. Esto corrige automáticamente todos los lugares que consumen esta función (tabla financiera, detalles de paquete, recibos, etc.).

### Cambio

**Archivo**: `src/lib/quoteHelpers.ts` (1 línea)

Línea 59, cambiar:
```typescript
const totalPrice = typeof quote.totalPrice === 'string' ? parseFloat(quote.totalPrice) : Number(quote.totalPrice || 0);
```

Por:
```typescript
const totalPrice = price + serviceFee + deliveryFee;
```

Esto es seguro porque `price`, `serviceFee` y `deliveryFee` ya se parsean individualmente en las líneas anteriores y son la fuente de verdad. El `totalPrice` guardado es solo una conveniencia que puede quedar desincronizada.

El `finalTotalPrice` explícito (cuando existe en la DB) seguirá siendo respetado para cotizaciones con descuentos aplicados correctamente.

