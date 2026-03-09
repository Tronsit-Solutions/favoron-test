

## Simplificar pestaña "Producto" del viajero

### Problema
En la pestaña "Producto" de `TravelerPackageDetails.tsx`, los detalles de productos están dentro de un desplegable ("Ver detalles de productos") y además se muestran los comprobantes y seguimiento, que ya existen en la pestaña "Docs".

### Cambios en `src/components/dashboard/traveler/TravelerPackageDetails.tsx`

1. **Eliminar el Collapsible de detalles de productos** (líneas 112-309): Mostrar los productos directamente después del resumen, sin el botón desplegable. Mantener todo el contenido interno (lista de productos con precios, tips, links, empaque original, notas adicionales).

2. **Eliminar la sección de documentos completa** (líneas 311-392): Quitar el Collapsible "Ver comprobantes y seguimiento" con todo su contenido (comprobante de compra, tracking info), ya que esta info ya vive en la pestaña "Docs".

3. **Limpiar imports no usados**: Remover `FileText`, `PurchaseConfirmationViewer`, `normalizeConfirmations`, y los estados `showDocuments`, `hasNewDocuments` y la función `checkForNewDocuments`.

### Resultado
La pestaña "Producto" mostrará: origen/destino + resumen del pedido + detalles de cada producto (visibles directamente) + notas adicionales. Sin desplegables ni documentos duplicados.

