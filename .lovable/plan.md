

## Plan: Convertir pedido fd0176b2 a personal y agregar foto

### Paquete encontrado
- **ID**: `fd0176b2-3ba8-4db2-81af-f60a0fd51e65`
- **Estado**: approved
- **Tipo actual**: online
- **Descripción**: Compra en shapedly.com

### Pasos

#### 1. Subir la foto al bucket `product-photos`
Copiar la imagen del usuario al proyecto y subirla al bucket `product-photos` en Supabase Storage bajo la carpeta del usuario dueño del paquete.

#### 2. Actualizar `products_data` en la base de datos
Modificar el paquete vía SQL (edge function temporal con service role):
- Cambiar `requestType` de `'online'` a `'personal'`
- Agregar la URL de la foto subida al array `productPhotos`
- Mantener todos los demás campos intactos (`estimatedPrice`, `itemDescription`, `quantity`, etc.)

### Resultado esperado
El paquete se mostrará como "Pedido personal" con la foto de referencia del producto (bras de Shapedly) visible en los modales de detalle y cotización.

