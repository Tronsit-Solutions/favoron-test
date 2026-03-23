

## Mostrar nombres de viajeros seleccionados en el modal de match

### Qué cambia
Agregar una sección visual debajo del botón "Confirmar Match" (o junto a él) que liste los nombres de los viajeros seleccionados, para que el admin pueda verificar antes de confirmar.

### Implementación — `src/components/admin/AdminMatchDialog.tsx`

**1. Crear un memo `selectedTravelerNames`**
Derivar los nombres de los viajeros seleccionados cruzando `selectedTripIds` con `travelerProfiles` y los trips disponibles:

```ts
const selectedTravelerNames = useMemo(() => {
  return Array.from(selectedTripIds).map(tripId => {
    const trip = [...validTrips, ...otherCityTrips, ...otherUSCityTrips, ...otherSpainCityTrips]
      .find(t => String(t.id) === tripId);
    return trip ? getTravelerName(trip.user_id) : 'Desconocido';
  });
}, [selectedTripIds, validTrips, otherCityTrips, otherUSCityTrips, otherSpainCityTrips, travelerProfiles]);
```

**2. Renderizar lista de seleccionados**
Dentro del action bar (línea ~1547), cuando `selectedTripIds.size > 0`, mostrar una fila con badges o chips con el nombre de cada viajero seleccionado. Ejemplo:

```
✅ Seleccionados: [Anika Erichsen] [Nicole Lopez] [Lucas Farias]
```

Usar `Badge` con variant `secondary` y un ícono ✅ o `UserCheck`.

**3. Bonus: resetear `selectedTripIds` al abrir**
Aprovechar para agregar las 2 líneas del fix pendiente (`setSelectedTripIds(new Set())` y `setSelectedTripId(null)`) en el `useEffect` de línea 374, corrigiendo el bug del conteo incorrecto.

### Archivos
- **Modificar**: `src/components/admin/AdminMatchDialog.tsx`

