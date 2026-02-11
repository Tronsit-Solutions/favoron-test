

## Mostrar comprobante de devolucion en filas de reembolso

### Objetivo

Que las filas de reembolso muestren el boton "Ver" para ver el comprobante de transferencia que el admin subio al completar el reembolso (campo `receipt_url` de `refund_orders`).

### Cambios en `src/components/admin/FinancialSummaryTable.tsx`

| Seccion | Cambio |
|---------|--------|
| Query de refunds (linea ~102) | Agregar `receipt_url, receipt_filename` al SELECT |
| Interface `EnrichedPackageData` (linea ~42) | Agregar `refundReceiptUrl?: string` y `refundReceiptFilename?: string` |
| Mapeo de refund data (linea ~333) | Pasar `receipt_url` y `receipt_filename` del refund al objeto enriquecido |
| Celda de comprobante (linea ~734) | Agregar condicion para refunds: si `item.isRefund && item.refundReceiptUrl`, mostrar boton "Ver" que abre el receipt desde el bucket `payment-receipts` (donde se guardan los comprobantes de reembolso) |

### Detalle tecnico

**1. Query** - Agregar campos al select:
```
.select('id, package_id, shopper_id, amount, reason, status, created_at, completed_at, cancelled_products, receipt_url, receipt_filename')
```

**2. Interface** - Dos campos nuevos opcionales:
```typescript
refundReceiptUrl?: string;
refundReceiptFilename?: string;
```

**3. Mapeo** - En el return del map de refundData:
```typescript
refundReceiptUrl: refund.receipt_url || null,
refundReceiptFilename: refund.receipt_filename || null,
```

**4. UI** - Modificar la condicion en linea ~734 para tambien mostrar el boton en reembolsos:
```typescript
{!item.isPrimeMembership && !item.isRefund && item.package.payment_receipt && (
  // ... boton existente
)}
{item.isRefund && item.refundReceiptUrl && (
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
)}
```

El path usa `refund-receipts/` como prefijo (que es donde `uploadRefundReceipt` en `useRefundOrders` guarda los archivos dentro del bucket `payment-receipts`).

