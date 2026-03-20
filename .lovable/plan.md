

## Fix: Botón "Ver" comprobante no aparece en Ingresos

### Causa raíz
El campo `payment_receipt` en packages guarda la ruta del archivo como `filePath`, no como `url` ni `receipt_url`. El código actual busca:
```
receiptData?.url || receiptData?.receipt_url
```
Pero el dato real es:
```
{ filePath: "user_id/pkg_id_payment_receipt.jpg", uploadedAt: "...", ... }
```

### Solución — `src/components/admin/CashFlowTable.tsx`

Cambiar la extracción de `receiptUrl` en `incomeRows` (línea ~114):

**Antes:**
```ts
receiptUrl: receiptData?.url || receiptData?.receipt_url || null,
receiptFilename: receiptData?.filename || receiptData?.receipt_filename || null,
```

**Después:**
```ts
receiptUrl: receiptData?.url || receiptData?.receipt_url || receiptData?.filePath || null,
receiptFilename: receiptData?.filename || receiptData?.receipt_filename || receiptData?.filePath?.split('/').pop() || null,
```

Esto cubre tanto el formato antiguo (`url`) como el actual (`filePath`). La función `handleViewReceipt` ya maneja rutas de storage (no-http) generando un signed URL, así que no necesita cambios.

