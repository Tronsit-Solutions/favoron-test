

## Bloquear acciones cuando el pago está siendo verificado

### Problema
Cuando el paquete está en estado `payment_pending_approval` (pago subido, esperando verificación), los botones "Solicitar re-cotización" y "Eliminar pedido" siguen apareciendo porque ese estado no está incluido en la lista `advancedStates`.

### Cambio

**`src/components/dashboard/shopper/ShopperPackagePriorityActions.tsx` (línea 139)**

Agregar `'payment_pending_approval'` al array `advancedStates`:

```tsx
const advancedStates = [
  'payment_pending_approval',
  'pending_purchase', 
  'purchase_confirmed', 
  // ...rest
];
```

Con esto, la condición en línea 485 (`!advancedStates.includes(pkg.status)`) bloqueará los botones de re-cotización y eliminación cuando el pago está siendo verificado.

