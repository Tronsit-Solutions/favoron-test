

## Agregar edición de etiquetas en la vista previa de batch

### Problema
En el modal de "Vista previa de etiquetas" (`LabelCartBar.tsx`), no se puede editar el contenido de las etiquetas antes de imprimir. El `PackageLabelModal` ya tiene esta funcionalidad con `customDescriptions`, pero el flujo batch de operaciones no la implementa.

### Plan

**Modificar `src/components/operations/LabelCartBar.tsx`**:

1. **Agregar estado para descripciones personalizadas**: `customDescriptions` como `{ [packageId: string]: { [productIndex: number]: string } }`.

2. **Agregar botón "Editar" en cada etiqueta** (icono `Edit`/`Pencil`) que aparezca al hacer hover, al lado del botón de eliminar (X). Al clickear, abrir un mini-formulario inline debajo del grid de etiquetas mostrando los campos de texto de los productos de esa etiqueta.

3. **Panel de edición**: Cuando se selecciona una etiqueta para editar, mostrar debajo del grid un bloque con `Textarea` por cada producto (similar a `PackageLabelModal`). Botones "Aplicar" y "Cancelar".

4. **Pasar `customDescriptions`** al componente `PackageLabel` en el preview y en el `handleDownloadPDF` para que las descripciones editadas se reflejen tanto en la vista previa como en el PDF final.

### Archivos a modificar
- `src/components/operations/LabelCartBar.tsx` — Estado de edición, UI de edición, pasar customDescriptions a PackageLabel

