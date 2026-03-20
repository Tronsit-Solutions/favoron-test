

## Fix: Modal de viajero tarda en abrir

### Causa raíz
`handleTravelerClick` (línea 496) ejecuta 3 queries secuenciales a Supabase **antes** de llamar `setShowTravelerInfo(true)` en línea 576. El modal no se abre hasta que todas terminan.

### Solución — `src/components/admin/AdminMatchDialog.tsx`

Mover `setShowTravelerInfo(true)` al inicio de la función (justo después de `setSelectedTraveler`), para que el modal se abra inmediatamente con los datos del perfil que ya están en `travelerProfiles`. Las queries de referral y packages se ejecutan en background y actualizan el modal cuando terminan.

```ts
const handleTravelerClick = async (trip: any) => {
  const profile = travelerProfiles[trip.user_id];
  setSelectedTraveler({ ...profile, trip, referral: null });
  setTravelerPackages([]); // clear previous
  setShowTravelerInfo(true); // ← ABRIR INMEDIATAMENTE

  // Fetch referral y packages en paralelo (background)
  // ... rest stays the same
};
```

Adicionalmente, ejecutar las dos queries (referral + packages) en **paralelo** con `Promise.all` en vez de secuencialmente, para que cuando los datos lleguen, lleguen más rápido.

Un cambio en una sola función, ~5 líneas modificadas.

