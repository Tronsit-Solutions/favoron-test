

## Agregar columna "Comprobante" a la tabla de Ingresos

### Cambio — `src/components/admin/CashFlowTable.tsx`

**Query** (línea 47): agregar `payment_receipt, recurrente_payment_id, label_number` al select de packages.

**incomeRows** (línea 98-113): agregar campos `receiptData` (del jsonb `payment_receipt`) y `recurrentePaymentId` al objeto de cada fila.

**Tabla de Ingresos**: agregar columna "Comprobante" después de "Método":
- Si `paymentMethod === "card"`: mostrar el `recurrente_payment_id` como texto monospace con prefijo "ID:" 
- Si `paymentMethod === "bank_transfer"` y existe `payment_receipt` con URL: botón "Ver" que abre el `ReceiptViewerModal` (mismo patrón que egresos)
- Si no hay comprobante: mostrar "—"

**Excel export** (línea 150-160): agregar columna "Comprobante" al sheet de ingresos con el ID de Recurrente o "Transferencia" según corresponda.

### Archivos
- **Modificar**: `src/components/admin/CashFlowTable.tsx`

