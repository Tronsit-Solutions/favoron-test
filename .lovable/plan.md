
# Plan: Corregir Comparación Case-Insensitive en getCountryLabel

## Problema Identificado

En `src/lib/countries.ts`, la función `getCountryLabel()` (línea 219-222) hace comparación case-sensitive:

```tsx
export const getCountryLabel = (countryValue: string): string | undefined => {
  const allCountries = [...MAIN_COUNTRIES, ...COUNTRIES];
  return allCountries.find(c => c.value === countryValue)?.label;
};
```

**Datos en BD:**
| Paquete | package_destination_country | Resultado getCountryLabel |
|---------|---------------------------|--------------------------|
| croxitos | "Guatemala" | undefined ❌ |
| PEluche | "guatemala" | "Guatemala" ✅ |

El value del país es `"guatemala"` (minúscula), pero algunos registros tienen `"Guatemala"` (mayúscula).

## Solución

### Archivo: `src/lib/countries.ts`

**Línea 221**: Hacer comparación case-insensitive usando `.toLowerCase()`:

```tsx
// Antes
return allCountries.find(c => c.value === countryValue)?.label;

// Después
return allCountries.find(c => c.value.toLowerCase() === countryValue?.toLowerCase())?.label;
```

## Resultado Esperado

| Antes | Después |
|-------|---------|
| Destino: Guatemala City | Destino: Guatemala, Guatemala City |
| Destino: Cualquier ciudad | Destino: Guatemala, Cualquier ciudad |

## Consideración Adicional

También conviene hacer lo mismo con `getCountryIsoCode()` para consistencia futura.
