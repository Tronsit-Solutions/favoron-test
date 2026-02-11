

## Fix: Columna "Método de Pago" muestra "Transferencia" para pagos con tarjeta

### Problema

El paquete de Edgar Osla se pagó con tarjeta (Recurrente), pero la tabla muestra "Transferencia". Esto ocurre porque los campos `payment_method` y `recurrente_checkout_id` **no se cargan** en las consultas de admin (son consultas "lightweight" optimizadas que omiten esos campos). Como resultado, la lógica cae al fallback de `payment_receipt` (que sí existe como JSON), y lo interpreta como transferencia.

### Solución

Dos cambios sencillos:

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useAdminData.tsx` | Agregar `payment_method, recurrente_checkout_id` a las dos consultas de paquetes (lineas ~97 y ~206) |
| `src/components/admin/FinancialSummaryTable.tsx` | Mejorar la lógica de detección para también revisar `payment_receipt.method === 'card'` como fallback adicional |

### Detalle técnico

**1. useAdminData.tsx** - Agregar campos a ambas queries:

- Query principal (linea ~97): agregar `payment_method, recurrente_checkout_id` al SELECT
- Query de matched packages (linea ~206): agregar `payment_method, recurrente_checkout_id` al SELECT

**2. FinancialSummaryTable.tsx** - Mejorar detección (linea ~254):

```typescript
const receipt = pkg.payment_receipt as any;
const paymentMethod = 
  pkg.recurrente_checkout_id || pkg.payment_method === 'card' || receipt?.method === 'card'
    ? 'Tarjeta'
    : (pkg.payment_method === 'bank_transfer' || pkg.payment_receipt)
      ? 'Transferencia'
      : '-';
```

Esto cubre el caso donde `payment_receipt` existe con `method: "card"` incluso si los otros campos no estuvieran cargados.
