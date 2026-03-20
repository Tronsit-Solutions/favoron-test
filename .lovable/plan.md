
## Fix: mostrar Tip Boost también en la pestaña de Viajes

### Causa raíz
En la pestaña de **Viajes** (`AdminMatchingTab > AvailableTripsTab`) el preview card no usa `trip.boost_code`.  
Actualmente calcula `hasBoost` consultando `boost_code_usage`, o sea solo muestra badge cuando el boost ya fue **aplicado** al acumulador.

Eso no coincide con el resto del sistema:
- `TripDetailModal` ya usa `trip.boost_code`
- `AdminApprovalsTab` ya usa `trip.boost_code`
- el diseño actual guarda la **intención** del boost en `trips.boost_code`

Por eso el viaje puede tener boost guardado y aun así no mostrar insignia en esa tarjeta.

### Cambios a implementar

**1. `src/components/admin/matching/AvailableTripsTab.tsx`**
- Eliminar la lógica de `boostedTripIds`
- Eliminar el `useEffect` que consulta `boost_code_usage`
- Pasar el estado del boost desde el propio viaje:
  - `hasBoost={Boolean(trip.boost_code)}`

Esto deja la pestaña alineada con el modelo actual del sistema.

**2. `src/components/admin/matching/TripCard.tsx`**
- Mantener el badge existente
- Opcionalmente mejorar el texto para que sea más claro:
  - `🚀 Boost`
  - o `🚀 Boost: {trip.boost_code}` si quieres ver el código directamente en la card

### Resultado esperado
En la pestaña de **Viajes**, cualquier viaje con `trip.boost_code`:
- mostrará la insignia de boost en el preview card
- aunque todavía no exista registro en `boost_code_usage`
- igual que ya sucede en Aprobaciones y en Detalles del viaje

### Detalle técnico
Hay dos conceptos distintos:
- `trips.boost_code` = el viajero/admin ingresó un booster
- `boost_code_usage` = el booster ya fue aplicado económicamente

Para UI de preview/admin, lo correcto es mostrar el badge usando `trips.boost_code`, no `boost_code_usage`.

### Archivos
- `src/components/admin/matching/AvailableTripsTab.tsx`
- opcional: `src/components/admin/matching/TripCard.tsx`
