

## Agregar tag "Boost" en viajes que tienen boost aplicado

### Enfoque

Consultar `boost_code_usage` para obtener los `trip_id` que tienen boost, y mostrar un badge `🚀 Boost` en las tarjetas de viaje. Visible solo para admins y viajeros (dueños del viaje).

### Cambios

1. **`src/components/dashboard/TripCard.tsx`** (viajero dashboard):
   - Ya tiene `tripPayment` via `useTripPayments` — usar `tripPayment?.boost_amount > 0` para mostrar un badge `🚀 Boost` junto al status badge
   - Solo mostrar si `isOwner` (viajero) o si el usuario es admin
   - Agregar prop `isAdmin?: boolean` al TripCardProps

2. **`src/components/Dashboard.tsx`**:
   - Pasar `isAdmin={isAdmin}` al TripCard

3. **`src/components/admin/matching/TripCard.tsx`** (admin matching view):
   - Agregar prop `hasBoost?: boolean`
   - Mostrar badge `🚀 Boost` cuando `hasBoost` es true

4. **`src/components/admin/matching/AvailableTripsTab.tsx`**:
   - Fetch `boost_code_usage` trip_ids al montar
   - Pasar `hasBoost={boostedTripIds.has(trip.id)}` a cada TripCard

### Badge visual
Badge pequeño con icono Rocket, fondo naranja/amber: `<Badge className="bg-amber-100 text-amber-800 border-amber-200">🚀 Boost</Badge>`

