

## Fix: Delivery fee clasificando municipios de Guatemala como "outside" (Q60 en vez de Q45)

### Problema
La función `getDeliveryZone` en `src/lib/pricing.ts` tiene una lista hardcoded de municipios del Departamento de Guatemala. Si el `cityArea` no coincide con ninguno de esos nombres específicos, cae al default `outside` (Q60). Pero la regla de negocio correcta es: **cualquier entrega dentro de Guatemala (país) que no sea Ciudad de Guatemala debe ser Q45**.

### Causa raíz
El `getDeliveryZone` solo recibe `cityArea` (string) y no tiene contexto del país. Un municipio guatemalteco que no esté en la lista hardcoded se clasifica como `outside`.

### Solución
Cambiar la lógica del three-tier system para que considere el **país de destino**:

1. **Modificar `getDeliveryZone`** en `src/lib/pricing.ts` para aceptar un parámetro opcional `destinationCountry`. Si el país es Guatemala y el cityArea no matchea Guatemala City, clasificar como `guatemala_department` (Q45) en vez de `outside`.

2. **Propagar `destinationCountry`** a todas las llamadas de `getDeliveryZone` y `getDeliveryFee`:
   - `src/contexts/PlatformFeesContext.tsx` — `getDeliveryFeeHelper`
   - `src/components/QuoteDialog.tsx` — pricing section
   - `src/utils/adminQuoteGeneration.ts`
   - `src/lib/quoteHelpers.ts` — `normalizeQuote`, `validateQuote`, etc.
   - `src/hooks/useDashboardActions.tsx` — quote generation calls

3. **Replicar la misma lógica** en las edge functions:
   - `supabase/functions/fix-delivery-fees-v3/index.ts`
   - `supabase/functions/intelligent-quote-backfill/index.ts`

### Lógica actualizada
```text
getDeliveryZone(cityArea, destinationCountry?):
  1. Si cityArea matchea GUATEMALA_DEPT_MUNICIPALITIES → guatemala_department
  2. Si cityArea matchea GUATEMALA_CITY_PATTERNS → guatemala_city  
  3. Si destinationCountry es "guatemala" → guatemala_department (NEW!)
  4. Default → outside
```

### Archivos a modificar
- `src/lib/pricing.ts` — Agregar param `destinationCountry` a `getDeliveryZone` y `getDeliveryFee`
- `src/contexts/PlatformFeesContext.tsx` — Propagar `destinationCountry` en `getDeliveryFeeHelper`
- `src/components/QuoteDialog.tsx` — Pasar `package_destination_country` al cálculo de zona
- `src/utils/adminQuoteGeneration.ts` — Pasar country al breakdown
- `src/lib/quoteHelpers.ts` — Agregar country param a `normalizeQuote`, `validateQuote`, `getDisplayTotal`
- `src/hooks/useDashboardActions.tsx` — Pasar country en las llamadas de quote
- `supabase/functions/fix-delivery-fees-v3/index.ts` — Misma lógica con country
- `supabase/functions/intelligent-quote-backfill/index.ts` — Misma lógica con country

