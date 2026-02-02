
# Plan: Delivery Fee Q0 para Devoluciones

## Cambio Requerido

Actualizar la función `getDeliveryFee()` en `src/lib/pricing.ts` para que retorne **Q0** cuando el método de entrega sea `return_dropoff` o `return_pickup`.

## Archivo: `src/lib/pricing.ts`

### Cambio en `getDeliveryFee()` (línea ~57)

Agregar condición al inicio de la función:

```typescript
export const getDeliveryFee = (
  deliveryMethod: string = 'pickup', 
  trustLevel?: TrustLevel | string,
  cityArea?: string
): number => {
  // No delivery fee for pickup or returns
  if (deliveryMethod === 'pickup' || 
      deliveryMethod === 'return_dropoff' || 
      deliveryMethod === 'return_pickup') {
    return 0;
  }
  
  // ... resto de la lógica existente
};
```

## Resultado

| Método de entrega | Delivery Fee |
|-------------------|--------------|
| `pickup` | Q0 |
| `return_dropoff` | Q0 |
| `return_pickup` | Q0 |
| `delivery` (Guatemala City) | Q25 (Q0 Prime) |
| `delivery` (fuera de Guatemala City) | Q60 (Q35 Prime) |

La compensación al viajero por devoluciones se maneja a través del tip asignado por admin.
