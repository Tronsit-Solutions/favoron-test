

## Plan: Three-Tier Delivery Fees (DB-driven, not hardcoded)

### New fee structure
- **Municipio de Guatemala**: Q25 (`delivery_fee_guatemala_city`)
- **Otros municipios del Depto. Guatemala** (Mixco, Villa Nueva, etc.): Q45 (`delivery_fee_guatemala_department`) — NEW
- **Fuera del Depto. Guatemala**: Q60 (`delivery_fee_outside_city`)

### Changes

**1. DB Migration** — Add column `delivery_fee_guatemala_department` (numeric, default 45) to `favoron_company_information`.

**2. Zone classifier** — Replace binary `isGuatemalaCityArea` with `getDeliveryZone()` returning `'guatemala_city' | 'guatemala_department' | 'outside'` in:
- `src/lib/pricing.ts`
- `src/contexts/PlatformFeesContext.tsx`

The current "excluded areas" list (Mixco, Villa Nueva, Petapa, etc.) becomes the identifier for `guatemala_department` zone instead of falling through to `outside`.

**3. `src/hooks/usePlatformFees.tsx`** — Add `delivery_fee_guatemala_department` to interface, defaults (45), select query, and form state.

**4. `src/pages/AdminPlatformFees.tsx`** — Add third input "Otros Municipios Dept. Guatemala (Q)" between City and Outside inputs. Update preview section to show 3 tiers.

**5. `src/contexts/PlatformFeesContext.tsx`** — Add `delivery_fee_guatemala_department` to interface, fallback, fetch, and update `getDeliveryFee` to use 3 zones with the new DB field.

**6. `src/lib/constants.ts`** — Add `GUATEMALA_DEPT_DELIVERY_FEE: 45` fallback.

**7. `src/lib/pricing.ts`** — Update `getDeliveryFee` to use 3 zones. Prime logic:
- Guatemala City: Q0
- Guatemala Dept: fee - discount
- Outside: fee - discount

**8. Edge functions** (`intelligent-quote-backfill`, `fix-delivery-fees-v3`) — Update zone logic and fee calculation to 3 tiers, fetching the new column from DB.

### Zone classification
```text
getDeliveryZone(cityArea):
  if matches Mixco, Villa Nueva, Petapa, etc. → 'guatemala_department'
  if matches Guatemala, Ciudad de Guatemala, zona X → 'guatemala_city'
  else → 'outside'
```

### Files affected
- **Create**: 1 migration SQL
- **Modify**: `AdminPlatformFees.tsx`, `usePlatformFees.tsx`, `PlatformFeesContext.tsx`, `pricing.ts`, `constants.ts`, 2 edge functions

