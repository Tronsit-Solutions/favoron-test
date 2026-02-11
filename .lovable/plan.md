

## Agregar reembolsos como filas negativas en la Tabla Resumen Financiera

### Objetivo

Intercalar los reembolsos aprobados/completados cronologicamente en la tabla financiera como filas con valores negativos, para reflejar el ingreso neto real.

### Cambios

| Archivo | Cambio |
|---------|--------|
| `src/components/admin/FinancialSummaryTable.tsx` | Fetch refund_orders, crear filas negativas, actualizar totales y Excel export |

### Detalle tecnico

**1. Nuevo query** - Fetch reembolsos aprobados y completados:

```typescript
const { data: refundOrders } = useQuery({
  queryKey: ['refunds-for-financial-table'],
  queryFn: async () => {
    const { data } = await supabase
      .from('refund_orders')
      .select('id, package_id, shopper_id, amount, reason, status, created_at, completed_at, cancelled_products')
      .in('status', ['approved', 'completed'])
      .order('created_at', { ascending: true });
    return data || [];
  }
});
```

**2. Interface** - Agregar campo `isRefund` y `refundAmount` a `EnrichedPackageData`:

```typescript
isRefund?: boolean;
refundAmount?: number;
```

**3. Crear filas de reembolso** en el `useMemo` de `enrichedData` (~linea 310):

- Cada refund_order genera una fila con:
  - `shopperName`: nombre del shopper (del profiles map, usando `shopper_id`)
  - `productDescription`: "Reembolso - [razon]" + productos cancelados
  - `paymentDate`: fecha de `completed_at` o `created_at`
  - `totalToPay`: **-amount** (negativo)
  - `favoronRevenue`: **-amount** (negativo, ya que es dinero que sale)
  - `travelerTip`: 0
  - `messengerPayment`: 0
  - `isRefund: true`

**4. UI de la fila** (~linea 539):

- Fondo rojo suave: `bg-red-50/50 hover:bg-red-100/50`
- Badge rojo "Reembolso" en la columna Estado
- Valores monetarios en rojo con signo negativo
- Icono `RotateCcw` en la columna de metodo de pago mostrando "Reembolso"

**5. Totales** (~linea 358):

- Agregar `totalRefunds` al acumulador
- En el summary card superior, agregar una nueva celda "Reembolsos" con el total en rojo
- En la fila de totales de la tabla, los valores ya se restan automaticamente porque son negativos

**6. Excel export** (~linea 383):

- Las filas de reembolso se exportan con tipo "Reembolso" y montos negativos
- Se agrega fila de "Total Reembolsos" al final

**7. Contador de transacciones** (~linea 456):

- Actualizar el texto para incluir reembolsos: "X paquetes + Y membresías Prime + Z reembolsos"

