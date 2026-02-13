

## Marcar reembolso Q22.50 como completado

### Accion
Actualizar la orden de reembolso del producto "Makeup Amarillo" (Q22.50, creada el 9 de febrero) de estado `approved` a `completed`, registrando la fecha de completado y el usuario admin que lo completo.

### Detalle tecnico
Ejecutar un UPDATE en la tabla `refund_orders` para el registro con monto Q22.50 del shopper Vida Villasenor, cambiando:
- `status`: de `approved` a `completed`
- `completed_at`: timestamp actual
- `completed_by`: ID del admin actual

No requiere cambios de codigo, solo una actualizacion de datos en la base de datos.

