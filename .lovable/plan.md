

## Plan: Corregir visualización de confirmaciones de compra (PDFs)

### Problema
El modal de visualización siempre usa `<img>` para mostrar documentos, pero las confirmaciones de compra son PDFs (`mimeType: "application/pdf"`). Los PDFs no pueden renderizarse en un tag `<img>`.

### Solución
Modificar `src/components/dashboard/UploadedDocumentsRegistry.tsx`:

1. **Ampliar el estado `modalImage`** para incluir el `mimeType` del documento
2. **En `viewPurchaseConfirmation`** y **`viewPaymentReceipt`**, pasar el `mimeType` al estado del modal
3. **En el modal de visualización** (línea ~230), detectar si el archivo es PDF y renderizar un `<iframe>` en vez de `<img>`

### Cambio clave en el render del modal
```tsx
// Si es PDF → iframe
// Si es imagen → img
{modalImage?.mimeType?.includes('pdf') ? (
  <iframe src={modalImage.url} className="w-full h-[70vh]" />
) : (
  <img src={modalImage.url} alt={modalImage.title} className="max-w-full max-h-[70vh] object-contain" />
)}
```

### Archivo modificado
- `src/components/dashboard/UploadedDocumentsRegistry.tsx`

