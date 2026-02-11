

## Agregar columna "Método de Pago" a la Tabla Resumen Financiera

### Cambio

Agregar una nueva columna entre "Estado" y "Total a Pagar" que muestre el metodo de pago utilizado por el shopper.

### Logica de deteccion

El metodo se determina a partir de los datos existentes en cada paquete:

- Si `payment_method === 'card'` o existe `recurrente_checkout_id` -> **Tarjeta**
- Si `payment_method === 'bank_transfer'` o hay comprobante manual -> **Transferencia**
- Para membresías Prime -> **Transferencia** (siempre son por deposito)
- Si no hay datos -> **-**

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/admin/FinancialSummaryTable.tsx` | Agregar campo `paymentMethod` al interface `EnrichedPackageData`, calcularlo en el `useMemo`, agregar `TableHead` y `TableCell` en la tabla, y agregar la columna al export de Excel |

### Detalle tecnico

1. **Interface**: Agregar `paymentMethod: string` a `EnrichedPackageData`
2. **Calculo** (linea ~252): Extraer el metodo de `pkg.payment_method` y `pkg.recurrente_checkout_id`
3. **Header** (linea ~513): Agregar `<TableHead>Metodo Pago</TableHead>` despues de "Estado"
4. **Celda** (linea ~596): Mostrar un Badge con icono (tarjeta de credito o banco) y texto corto
5. **Excel** (linea ~373): Agregar columna `'Metodo Pago'` al export
6. **Fila totales** (linea ~650): Agregar `<TableCell></TableCell>` vacia para mantener la alineacion

