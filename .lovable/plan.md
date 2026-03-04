

## Plan: Agregar fotos a pedidos personales desde el admin

### Contexto
Actualmente el admin puede ver fotos de productos personales pero no puede agregar nuevas. La subida de fotos solo existe en el formulario de solicitud del shopper (`ProductPhotoUpload`). El admin necesita poder agregar fotos directamente desde el modal de detalle del paquete.

### Cambio

**Archivo: `src/components/admin/PackageDetailModal.tsx`**

1. **En la sección de fotos de productos personales** (línea ~1753), agregar un botón "Agregar Foto" debajo de las fotos existentes (o como área de upload si no hay fotos).

2. **Nueva función `handleAdminAddPhoto`**:
   - Abre un file input oculto para seleccionar imagen
   - Sube la imagen al bucket `product-photos` bajo la carpeta del usuario dueño del paquete (`pkg.user_id`)
   - Actualiza `products_data` del paquete: agrega la referencia de storage al array `productPhotos` del producto correspondiente
   - Usa `onUpdatePackage` para guardar los cambios (mismo patrón que la edición existente)

3. **UI**: Un botón pequeño con icono `Upload` + "Agregar Foto" que aparece solo para pedidos `personal`, junto a las fotos existentes. Incluir un `<input type="file" hidden>` con ref.

4. **Flujo**:
   - Admin hace clic en "Agregar Foto" en un producto específico
   - Se abre selector de archivos (JPG, PNG, WebP, max 5MB)
   - Se sube al bucket `product-photos/{user_id}/product_{timestamp}.ext`
   - Se actualiza `products_data[index].productPhotos` con la nueva referencia
   - Se llama `onUpdatePackage` con el `products_data` actualizado
   - Toast de confirmación

### Alcance
- Solo se modifica `PackageDetailModal.tsx`
- Se reutiliza la misma lógica de storage que `ProductPhotoUpload` pero simplificada para admin
- No se necesitan migraciones de DB ni nuevas edge functions

