

## Corregir comprobantes de reembolso perdidos

### Causa raiz

En `useRefundOrders.tsx`, la funcion `updateRefundStatus` solo guarda `receipt_url` y `receipt_filename` cuando `status === 'completed'`. Cuando el admin aprueba un reembolso con comprobante adjunto, el archivo se sube al storage exitosamente, pero la referencia nunca se guarda en la base de datos porque el status es `'approved'`, no `'completed'`.

```text
handleApprove -> uploadRefundReceipt (OK, archivo guardado en storage)
             -> updateRefundStatus('approved', ..., receiptUrl, receiptFilename)
                  -> if (status === 'completed') { ... } // NUNCA ENTRA
                  -> receipt_url queda null en la DB
```

### Solucion: 2 pasos

**Paso 1: Reparar datos existentes (SQL)**

Actualizar las 7 ordenes de reembolso que tienen archivos en storage pero `receipt_url = null`:

```sql
UPDATE refund_orders SET receipt_url = 'refund-receipts/015fd8ad-...-1769025787482.png', receipt_filename = 'comprobante.png', status = 'completed', completed_at = now() WHERE id = '015fd8ad-66b0-4abc-b1be-d8219c780177';
-- (repetir para las 7 ordenes)
```

**Paso 2: Corregir el codigo en `useRefundOrders.tsx`**

Modificar `updateRefundStatus` para que siempre guarde `receipt_url` y `receipt_filename` cuando se proporcionan, sin importar el status:

Antes:
```typescript
if (status === 'completed') {
  updates.completed_at = new Date().toISOString();
  updates.completed_by = user?.id;
  if (receiptUrl) updates.receipt_url = receiptUrl;
  if (receiptFilename) updates.receipt_filename = receiptFilename;
}
```

Despues:
```typescript
// Siempre guardar receipt si se proporciona
if (receiptUrl) updates.receipt_url = receiptUrl;
if (receiptFilename) updates.receipt_filename = receiptFilename;

if (status === 'completed') {
  updates.completed_at = new Date().toISOString();
  updates.completed_by = user?.id;
}
```

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useRefundOrders.tsx` | Mover `receipt_url`/`receipt_filename` fuera del `if (status === 'completed')` |
| Base de datos (SQL) | Actualizar 7 registros con sus `receipt_url` correctos y marcarlos como `completed` |

### Resultado esperado

- Las 7 ordenes con archivos existentes mostraran el boton "Ver" en la tabla financiera
- Futuros reembolsos aprobados con comprobante guardaran la referencia correctamente
- Las ordenes sin archivo en storage seguiran mostrando "Pendiente"

