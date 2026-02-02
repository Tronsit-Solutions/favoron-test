# ✅ COMPLETADO: Integrar "Devolución" como opción dentro de Pedido Personal

## Cambios Implementados

1. ✅ Pregunta "¿Tu pedido es una devolución?" (Sí/No) después de seleccionar Pedido Personal
2. ✅ Opciones de entrega adaptadas para devoluciones en el paso de Ruta:
   - "Entregarlo en un punto de devolución" (UPS Store, FedEx Office, etc.)
   - "Una empresa recogerá el paquete en tu domicilio en [país destino]"
3. ✅ Nota de costos de envío se oculta para devoluciones

## Archivo Modificado

- `src/components/PackageRequestForm.tsx`

## Nuevos delivery methods para devoluciones

- `return_dropoff` - El viajero entrega en punto de devolución
- `return_pickup` - Una empresa recoge el paquete en dirección del viajero
