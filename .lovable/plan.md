

## Plan: Etiquetas PDF vectoriales (eliminar html2canvas)

### Problema
Los 3 puntos de generación de PDF (`LabelCartBar.tsx`, `OperationsLabelsTab.tsx`, `PackageLabelModal.tsx`) usan `html2canvas` para rasterizar el componente React `PackageLabel` como imagen PNG y luego insertarla en el PDF. Esto produce archivos de ~2MB porque cada etiqueta es una imagen de ~500KB.

### Solución
Crear una función utilitaria `drawLabelToPDF(pdf, pkg, x, y, width, height, options)` que dibuje la etiqueta directamente con métodos nativos de jsPDF (`pdf.text()`, `pdf.rect()`, `pdf.line()`, `pdf.addImage()` solo para el logo). Esto reduce el tamaño a ~50KB y hace el texto seleccionable.

### Archivos

**Crear: `src/lib/pdfLabelDrawer.ts`**
- Función `drawLabelToPDF(pdf, pkg, x, y, w, h, opts)` que replica el diseño de `PackageLabel` usando:
  - `pdf.rect()` para bordes
  - `pdf.text()` para texto (monospace)
  - `pdf.line()` para separadores
  - `pdf.addImage()` solo para el logo (una vez, cacheado)
- Maneja: información del pedido, productos con cantidades, número de seguimiento, destinatario, entrega, dirección, número de etiqueta
- Acepta `customDescriptions` y `labelNumber` como opciones

**Modificar: `src/components/operations/LabelCartBar.tsx`**
- Reemplazar el loop de `html2canvas` + `ReactDOM.createRoot` por llamadas a `drawLabelToPDF`
- Eliminar imports de `html2canvas`, `PackageLabel` (del PDF, mantener para preview), `ReactDOM`

**Modificar: `src/components/operations/OperationsLabelsTab.tsx`**
- Mismo cambio: reemplazar `html2canvas` por `drawLabelToPDF`
- Eliminar imports innecesarios

**Modificar: `src/components/admin/PackageLabelModal.tsx`**
- Mismo cambio en `generatePDF()`

**Resultado**: PDFs de ~50KB en vez de ~2MB, generación más rápida, texto seleccionable.

