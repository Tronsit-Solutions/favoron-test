

## Mostrar badge de Boost en TripCard del dashboard usando `boost_code`

### Problema
El badge 🚀 Boost en el TripCard del dashboard solo se muestra cuando `tripPayment?.boost_amount > 0`. Pero el acumulador (`trip_payment_accumulator`) se crea tardíamente, así que viajes con un `boost_code` registrado pero sin acumulador no muestran el badge.

### Solución — `src/components/dashboard/TripCard.tsx`

Ampliar la condición del badge de Boost (línea 165) para incluir también `trip.boost_code`:

```ts
// Antes:
{(isOwner || isAdmin) && tripPayment?.boost_amount > 0 && (

// Después:
{(isOwner || isAdmin) && (tripPayment?.boost_amount > 0 || trip.boost_code) && (
```

Esto es consistente con cómo lo manejan `AdminApprovals` y `AvailableTripsTab` según la documentación del sistema.

### Archivos
- **Modificar**: `src/components/dashboard/TripCard.tsx` — línea 165, ampliar condición

