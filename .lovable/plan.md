

## Cambiar tipo de solicitud de paquete 055f87ab a "online"

### Datos actuales
- **Paquete**: 055f87ab — "2 Cheirosa 62 Jelly Perfume Balm"
- **Estado**: approved
- **requestType actual**: `personal`
- **requestType deseado**: `online`

### Acción

Desplegar una edge function temporal `admin-patch-package` que con service role actualice el campo `requestType` dentro de `products_data[0]` de `"personal"` a `"online"` para el paquete `055f87ab-9243-4e9e-a0d3-5db0ccccdfba`. Después de confirmar la ejecución, eliminar la función temporal.

La función:
1. Lee el `products_data` actual del paquete
2. Modifica `products_data[0].requestType` a `"online"`
3. Actualiza el registro con el nuevo `products_data`

No se requieren cambios en el frontend.

