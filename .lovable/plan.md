

## Restar deliveryFee de reembolsos en "Pago Mensajeros"

### Problema actual
En `FinancialSummaryTable.tsx` (linea 416), los reembolsos se registran con `messengerPayment: 0`, por lo que el total de "Pago Mensajeros" no refleja las devoluciones de delivery fee cuando se cancela un paquete completo.

### Cambio propuesto

**Archivo: `src/components/admin/FinancialSummaryTable.tsx`**

En el bloque de procesamiento de refunds (lineas ~374-416), agregar extraccion de `deliveryFee` desde los metadatos de `cancelled_products`, siguiendo el mismo patron usado para `serviceFee`:

1. **Extraer deliveryFee** (despues de linea 393): Sumar el campo `deliveryFee` de cada producto cancelado en los metadatos. Si no existe en metadatos individuales, buscar un campo `deliveryFee` a nivel del array o del refund mismo.

2. **Asignar como negativo** (linea 416): Cambiar `messengerPayment: 0` a `messengerPayment: -refundDeliveryFee`.

### Detalle tecnico

```text
Lineas ~389-393: Agregar despues del calculo de refundServiceFee:

  let refundDeliveryFee = 0;
  refundDeliveryFee = cancelledProducts.reduce((sum, p) => {
    if (p.deliveryFee !== undefined) return sum + (Number(p.deliveryFee) || 0);
    return sum;
  }, 0);

Linea 416: Cambiar
  messengerPayment: 0
por
  messengerPayment: -refundDeliveryFee
```

Esto solo afectara reembolsos que tengan `deliveryFee` en sus metadatos (cancelaciones de paquete completo). Las cancelaciones parciales de productos no incluyen deliveryFee en sus metadatos, por lo que seguiran con `messengerPayment: 0`, que es el comportamiento correcto segun la regla de negocio.

