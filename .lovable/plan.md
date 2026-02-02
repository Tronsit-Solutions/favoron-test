
# Plan: Corregir Guardado de `to_country` en Viajes

## Problema Identificado

### Causa Raíz
En `src/hooks/useDashboardActions.tsx`, línea 168-181, la función `handleTripSubmit` NO mapea el campo `toCountry` del formulario al campo `to_country` de la base de datos:

```javascript
const dbTripData = {
  from_city: tripData.fromCity,
  from_country: tripData.fromCountry, // ✅ Origen sí se mapea
  to_city: tripData.toCity,
  // ❌ to_country: tripData.toCountry  <-- FALTA ESTA LÍNEA
  ...
};
```

### Evidencia en Base de Datos
La consulta muestra que `to_country` es "Guatemala" para todos los viajes, incluso para destinos como Miami, Madrid, Houston, Las Vegas:

| to_city | to_country | Debería ser |
|---------|------------|-------------|
| Miami | Guatemala | estados-unidos |
| Madrid | Guatemala | espana |
| Houston | Guatemala | estados-unidos |
| Las Vegas | Guatemala | estados-unidos |

### Impacto
El modal de "Hacer Match" (AdminMatchDialog.tsx) usa `to_country` para filtrar viajes disponibles. Como todos tienen "Guatemala", los paquetes con destino "Estados Unidos" no encuentran viajes compatibles.

---

## Solución

### Archivo: `src/hooks/useDashboardActions.tsx`

**Cambio en línea 171** - Agregar el mapeo faltante:

```javascript
const dbTripData = {
  from_city: tripData.fromCity,
  from_country: tripData.fromCountry,
  to_city: tripData.toCity,
  to_country: tripData.toCountry, // ✅ AGREGAR ESTA LÍNEA
  arrival_date: safeToISOString(tripData.arrivalDate),
  ...
};
```

---

## Datos Existentes (Migración de Backfill)

Los viajes existentes tienen `to_country = 'Guatemala'` incorrecto. Se necesita una migración SQL para corregir los datos basándose en `to_city`:

```sql
UPDATE trips SET to_country = 'estados-unidos'
WHERE to_city IN ('Miami', 'New York', 'Los Angeles', 'Houston', 'Chicago', 'Las Vegas', 'Fort Lauderdale')
AND to_country = 'Guatemala';

UPDATE trips SET to_country = 'espana'
WHERE to_city IN ('Madrid', 'Barcelona', 'Valencia', 'Sevilla')
AND to_country = 'Guatemala';

UPDATE trips SET to_country = 'mexico'
WHERE to_city IN ('Ciudad de México', 'Cancún', 'Guadalajara', 'Monterrey')
AND to_country = 'Guatemala';
```

---

## Resultado Esperado

1. **Nuevos viajes**: Se guardarán con el `to_country` correcto desde el formulario
2. **Viajes existentes**: Se corregirán con la migración SQL
3. **AdminMatchDialog**: Podrá encontrar viajes compatibles para paquetes con destinos internacionales
