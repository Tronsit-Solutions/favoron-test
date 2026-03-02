

## Plan: Cambiar ciudades de EE.UU. a estados

### Problema
El dropdown de ciudades para Estados Unidos muestra ciudades (New York, Los Angeles, etc.) cuando sería más útil mostrar estados (Florida, California, Texas, etc.) tanto en origen como en destino.

### Cambios

**`src/lib/cities.ts`**
- Renombrar `US_CITIES` a `US_STATES` y reemplazar la lista de ~39 ciudades por los 50 estados de EE.UU. + DC, con formato `{ value: 'Florida', label: 'Florida' }`.
- Actualizar la referencia en `getCitiesByCountry` para que `'estados-unidos'` devuelva `US_STATES`.

No se necesitan cambios en `TripForm.tsx` ni `EditTripModal.tsx` porque ya consumen `getCitiesByCountry` dinámicamente.

