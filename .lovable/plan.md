

## Unificar comprobante de pago dentro del TripTipsModal

Actualmente el comprobante de pago del viaje se ve en un modal separado (`ReceiptViewerModal`) accesible desde un botón "Comprobante" en el TripCard. El objetivo es mostrar el comprobante directamente dentro del `TripTipsModal`, eliminando el botón y modal separados.

### Cambios

**`src/components/dashboard/TripTipsModal.tsx`**:
- Agregar estado y lógica para resolver la URL del comprobante desde `tripPayment.payment_receipt_url` (misma lógica que ya tiene TripCard: normalizar path, usar `useSignedUrl` o descarga directa desde Storage)
- Después de la sección de acción (botón solicitar cobro / "ya se solicitó"), agregar una sección condicional que muestre el comprobante cuando `tripPayment.payment_receipt_url` existe
- Mostrar la imagen/PDF inline dentro del modal usando la misma lógica del `ReceiptViewerModal` pero embebida (sin Dialog wrapper), con botón de descarga
- Importar `useSignedUrl` y `supabase` para resolver URLs firmadas

**`src/components/dashboard/TripCard.tsx`**:
- Eliminar el botón "Comprobante" del header (líneas 115-126)
- Eliminar el `ReceiptViewerModal` y su estado asociado (`showReceiptModal`, `paymentReceipt`, el `useEffect` que lo setea)
- Limpiar imports no usados (`ReceiptViewerModal`, posiblemente `FileText` si no se usa en otro lado)

### Resultado
El viajero abre el modal de Tips y ve todo unificado: resumen de tips, progreso de entrega, paquetes, botón de cobro, y si ya se pagó, el comprobante visible al final del mismo modal.

