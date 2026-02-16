

## Agregar preview de imagen adjunta en el modal de Completar Pago

Cuando el admin adjunta una foto de comprobante de pago, actualmente solo se muestra el nombre del archivo. Se agregara una miniatura (thumbnail) de la imagen para que el admin pueda verificar visualmente que adjunto el archivo correcto antes de confirmar.

### Cambio en `src/components/admin/AdminTravelerPaymentsTab.tsx`

**Reemplazar la seccion de archivo adjunto (lineas 833-838)** que actualmente muestra solo el nombre del archivo con un preview visual:

- Usar `URL.createObjectURL(receiptPhoto)` para generar una URL temporal del archivo seleccionado
- Mostrar un thumbnail de la imagen (max 200px de alto, bordes redondeados)
- Mantener el nombre del archivo debajo de la imagen
- Hacer click en la imagen para verla en tamano completo (usando el ImageViewerModal que ya existe en el componente)
- Limpiar el object URL cuando cambie la foto para evitar memory leaks (con `URL.revokeObjectURL`)

### Resultado esperado

Despues de adjuntar una foto, el admin vera:
1. Boton "Cambiar foto" + boton X para eliminar
2. Miniatura de la imagen adjuntada (clickeable para ver en grande)
3. Nombre del archivo con check verde

