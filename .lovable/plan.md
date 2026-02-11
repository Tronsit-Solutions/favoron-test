

## Fix: Paquete "Pachon Gatorade" de Valeria Villeda no aparece en tabla financiera

### Causa raiz

El filtro `cancelledButPaid` en `FinancialSummaryTable.tsx` (linea 89-94) no detecta el paquete porque:

1. **`recurrente_payment_id` no se incluye en el query de admin** (`useAdminData.tsx` linea 96-107): el SELECT solo trae `recurrente_checkout_id` y `payment_method`, pero NO `recurrente_payment_id`. Por lo tanto `pkg.recurrente_payment_id` es siempre `undefined`.

2. **La deteccion de comprobante manual falla para pagos con tarjeta**: el filtro busca `(payment_receipt as any).filePath` (una ruta de archivo subido manualmente), pero los pagos con tarjeta guardan en `payment_receipt` un objeto diferente con campos como `{ method: 'card', payment_id: 'pa_xxx', provider: 'recurrente' }` que no tiene `filePath`.

### Solucion

**Archivo 1: `src/hooks/useAdminData.tsx`**
- Agregar `recurrente_payment_id` al SELECT de la funcion `fetchAdminPackages` (linea 106)
- Cambiar: `payment_method, recurrente_checkout_id`
- Por: `payment_method, recurrente_checkout_id, recurrente_payment_id`

**Archivo 2: `src/components/admin/FinancialSummaryTable.tsx`**
- Mejorar la deteccion de `cancelledButPaid` (lineas 89-94) para tambien detectar pagos con tarjeta via `payment_receipt`:

```typescript
if (cancelledButPaid.includes(pkg.status)) {
  const receipt = pkg.payment_receipt as any;
  const hasManualReceipt = receipt && typeof receipt === 'object' && receipt.filePath;
  const hasCardPayment = !!pkg.recurrente_payment_id;
  const hasCardReceiptEvidence = receipt && typeof receipt === 'object' && 
    (receipt.method === 'card' || receipt.payment_id || receipt.provider === 'recurrente');
  return hasManualReceipt || hasCardPayment || hasCardReceiptEvidence;
}
```

Esto cubre tres escenarios de pago:
- Transferencia bancaria manual (tiene `filePath` en payment_receipt)
- Pago con tarjeta detectado via `recurrente_payment_id` (ahora si se fetchea)
- Pago con tarjeta detectado via campos en `payment_receipt` (redundancia de seguridad)

### Impacto

Solo afecta paquetes cancelados que fueron pagados. No cambia la logica para paquetes en estados normales del flujo.

