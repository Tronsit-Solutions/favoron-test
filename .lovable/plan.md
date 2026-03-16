

## Fix: PDF no carga en PurchaseConfirmationViewer

### Problema
El componente `PurchaseConfirmationViewer` usa la signed URL directamente en un `<iframe>` para mostrar PDFs. Supabase Storage devuelve headers (`Content-Disposition: attachment`) que impiden que el navegador renderice el PDF inline — en su lugar muestra una página en blanco.

### Solución
Aplicar el mismo patrón que ya funciona en `FavoronPaymentReceiptViewer`: descargar el PDF como blob con `supabase.storage.download()`, crear un blob URL con el MIME type correcto (`application/pdf`), y usar ese blob URL en el `<iframe>`.

### Cambios en `src/components/admin/PurchaseConfirmationViewer.tsx`

1. **Agregar estado** `pdfBlobUrl` y `loadingPdf`
2. **Agregar función** `loadPdfAsBlob` que descarga el archivo y crea un blob URL
3. **Disparar la carga del blob** cuando se abre el modal y el archivo es PDF
4. **Limpiar el blob URL** al desmontar o cerrar el modal
5. **Actualizar el iframe** para usar `pdfBlobUrl` en lugar de `signedUrl`, con estados de carga y error

El patrón es idéntico al de `FavoronPaymentReceiptViewer` (líneas 85-115), adaptado a la lógica de múltiples buckets de este componente.

