

## Fix: Orden de cobro no incluye el boost

### Causa raíz

En `src/hooks/useTripPayments.tsx`, línea 142, al recalcular el monto antes de crear la orden de pago, solo se lee `accumulated_amount` del acumulador:

```ts
.select('accumulated_amount')  // ← falta boost_amount
```

Luego en línea 182, se pasa `freshAmount` (sin boost) como `_amount` al RPC.

### Solución

**Archivo: `src/hooks/useTripPayments.tsx`**

1. **Línea 142**: Cambiar el select para incluir `boost_amount`:
   ```ts
   .select('accumulated_amount, boost_amount')
   ```

2. **Línea 149**: Sumar el boost al monto:
   ```ts
   const baseAmount = freshAccumulator?.accumulated_amount ?? tripPayment.accumulated_amount;
   const boostAmount = Number(freshAccumulator?.boost_amount) || 0;
   const freshAmount = baseAmount + boostAmount;
   ```

Esto garantiza que el monto de la orden de pago incluya siempre el boost aplicado.

