

## Agregar comprobante a ordenes de pago ya procesadas

### Problema
Cuando una orden de pago ya fue procesada (status `completed`) sin adjuntar comprobante, no hay manera de agregarlo despues desde el modal de detalle.

### Solucion

**Archivo**: `src/components/admin/PaymentOrderDetailModal.tsx`

**1. Agregar imports necesarios**
- Importar `useState` de React
- Importar `FavoronPaymentReceiptUpload` desde `./FavoronPaymentReceiptUpload`
- Importar `FavoronPaymentReceiptViewer` desde `./FavoronPaymentReceiptViewer`
- Importar `Upload` de lucide-react

**2. Agregar estado local para refresh**
- `receiptJustUploaded`: booleano para forzar re-render del modal despues de subir un comprobante, mostrando el viewer en lugar del uploader sin cerrar el modal.

**3. Agregar seccion de comprobante al modal (despues de "Estado de la Orden")**

Dentro de la Card de "Estado de la Orden", reemplazar la seccion actual que solo muestra un boton "Ver" cuando existe `receipt_url` con una logica mas completa:

- **Si hay `receipt_url`**: Mostrar el `FavoronPaymentReceiptViewer` existente para ver/descargar el comprobante
- **Si NO hay `receipt_url` y el status es `completed`**: Mostrar el componente `FavoronPaymentReceiptUpload` para que el admin pueda subir el comprobante que se le olvido

El `onUploadComplete` del uploader activara `receiptJustUploaded` para refrescar la vista y mostrar el viewer.

### Resultado esperado

En el modal de detalle de ordenes procesadas:
- Si ya tiene comprobante: se ve el viewer con opciones de ver/descargar
- Si no tiene comprobante: se muestra el formulario de subida con el texto "Subir Comprobante de Pago de Favoron"
- Despues de subir: se muestra automaticamente el viewer sin cerrar el modal
