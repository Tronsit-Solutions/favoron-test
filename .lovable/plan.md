

## El país SÍ se está guardando correctamente

Revisé la base de datos y **todos los paquetes recientes tienen el campo `package_destination_country` guardado correctamente** (ej: `Guatemala`, `Guatemala City`). Solo hay 2 registros antiguos (de febrero) donde está null.

El problema real es que el **modal de edición** (`EditPackageModal`) no muestra el país guardado porque usa `COUNTRY_QUICK_OPTIONS` con slugs (`'guatemala'`) mientras que la DB tiene labels (`'Guatemala'`). Este es el fix que ya aprobaste antes pero no se implementó.

### Fix en `src/components/dashboard/EditPackageModal.tsx`

1. **Remover** imports de `COUNTRY_QUICK_OPTIONS`, `getCitiesByCountry`, `countryHasCities`
2. **Agregar** las mismas listas hardcodeadas que usa `PackageRequestForm`:
   ```typescript
   const destinationCountries = [
     { value: 'Guatemala', label: 'Guatemala' },
     { value: 'Estados Unidos', label: 'Estados Unidos' },
     { value: 'España', label: 'España' },
     { value: 'México', label: 'México' },
     { value: 'Otro', label: 'Otro país' }
   ];
   const citiesByCountry = { 'Guatemala': [...], 'Estados Unidos': [...], ... };
   ```
3. Reemplazar `cityOptions`/`hasCities` con lookups al nuevo `citiesByCountry`

Esto hará que los Select values coincidan con lo que está en la DB y se pre-seleccionen correctamente.

