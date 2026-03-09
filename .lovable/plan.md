

## Simplificar TripCard: quitar dirección, agregar ID

### Cambios en `src/components/dashboard/TripCard.tsx`

1. **Eliminar** los bloques de dirección del área clickable (líneas 154-178): recipientName, streetAddress, y contactNumber. Mantener solo el rango de fechas y el click handler.

2. **Agregar Trip ID** como texto discreto junto a la ruta o debajo de ella. Formato: `ID: {trip.id.slice(0, 8)}` en texto pequeño y color muted, para fácil referencia sin saturar.

El resultado será un card más limpio que muestra: ruta, ID corto, fechas de recepción, y acciones.

