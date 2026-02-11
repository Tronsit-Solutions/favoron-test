

## Fix: Mostrar estado de comprobante en filas de reembolso

### Diagnostico

El codigo esta correcto, pero **ninguna orden de reembolso tiene un comprobante subido** (`receipt_url` es `null` en las 10 ordenes). Todas estan en estado `approved` (no `completed`). El comprobante se sube cuando el admin marca el reembolso como "completado" desde la pestana de Reembolsos.

Por eso la columna aparece vacia: el boton "Ver" solo aparece cuando hay un `receipt_url`.

### Mejora propuesta

Para que no se vea vacio/roto, mostrar un indicador en la columna de comprobante para filas de reembolso:

- **Con comprobante**: Boton "Ver" (ya implementado, funcionara cuando se suba uno)
- **Sin comprobante**: Texto "Pendiente" en gris para que el admin sepa que falta subir el comprobante de devolucion

### Cambio en `src/components/admin/FinancialSummaryTable.tsx`

Modificar la seccion de la celda de comprobante (linea ~770) para que las filas de reembolso siempre muestren algo:

```typescript
{item.isRefund && (
  item.refundReceiptUrl ? (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        let normalized = item.refundReceiptUrl!;
        if (!normalized.startsWith('http') && !normalized.includes('/storage/v1/object')) {
          if (!normalized.startsWith('refund-receipts/')) {
            normalized = `refund-receipts/${normalized}`;
          }
        }
        setSelectedPaymentReceipt(normalized);
        setSelectedReceiptFilename(item.refundReceiptFilename || 'comprobante-reembolso.jpg');
      }}
    >
      <Eye className="h-3 w-3 mr-1" />
      Ver
    </Button>
  ) : (
    <span className="text-xs text-muted-foreground">Pendiente</span>
  )
)}
```

### Nota importante

Para que aparezca el boton "Ver" en los reembolsos, el admin debe ir a la pestana **Reembolsos** y marcar cada reembolso como **"Completado"** subiendo el comprobante de transferencia. Actualmente todos los reembolsos estan en estado "Aprobado" sin comprobante.

