
## Corregir exclusion de productos cancelados en ordenes de pago

### Problema detectado

El paquete "Pedido de 3 productos: Makeup rosado, Makeup cejas, Makeup Amarillo" (ID: `106aac44`) tiene el producto "Makeup Amarillo" marcado como `cancelled: true` desde el 9 de febrero. Sin embargo:

1. El `admin_assigned_tip` del paquete sigue siendo Q90 (60 + 15 + 15), incluyendo los Q15 del producto cancelado
2. El modal "Completar Pago" muestra "Makeup Amarillo" sin ninguna distincion visual
3. El acumulador y la orden de pago suman Q520 cuando deberian ser Q505

### Cambios propuestos

**1. `src/utils/createAccumulatorForTrip.ts` (useCreateTripPaymentAccumulator)**

Modificar la logica de calculo de tips (linea ~37) para que, en paquetes con `products_data`, sume solo los tips de productos activos (no cancelados) en lugar de usar el `admin_assigned_tip` del paquete directamente:

```
// Antes: tip = admin_assigned_tip || quote.price
// Despues: si hay products_data, sumar solo adminAssignedTip de productos no cancelados
```

**2. `src/components/admin/AdminTravelerPaymentsTab.tsx`**

En la seccion de desglose de productos (linea ~646), filtrar productos cancelados del array antes de renderizar:

```
productsArray.filter(p => !p.cancelled)
```

Opcionalmente mostrar productos cancelados con estilo tachado y badge "(cancelado)" para contexto, similar a como se hace en QuoteDialog.

**3. `src/components/TripBankingConfirmationModal.tsx`**

Aplicar la misma logica: al calcular el tip por paquete con `getPackageTipFromQuote`, verificar que excluya productos cancelados si hay `products_data`.

**4. `src/utils/tipHelpers.ts`**

Revisar `getPackageTipFromQuote` para que, cuando un paquete tiene `products_data`, sume solo los tips de productos activos.

### Correccion de datos existentes

Ejecutar una correccion manual del monto de la orden de pago de Anika:
- Actualizar `admin_assigned_tip` del paquete `106aac44` de Q90 a Q75
- Actualizar el acumulador de Q520 a Q505
- Actualizar la orden de pago `88ed8ffe` de Q520 a Q505

### Detalle tecnico

La funcion de calculo de tip quedaria asi:

```text
Para cada paquete:
  1. Si tiene products_data (array):
     - Filtrar productos donde cancelled !== true
     - Sumar adminAssignedTip de cada producto activo
  2. Si no tiene products_data:
     - Usar admin_assigned_tip o quote.price como antes
```

Esto es consistente con las reglas de negocio ya documentadas sobre exclusion de productos cancelados en calculos de tips.
