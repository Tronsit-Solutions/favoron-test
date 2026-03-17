

## Fix: Missing postal code in quote comparison

### Problem
The `MultiQuoteSelector` extracts `travelerAddr?.zipCode` but the actual field stored in the database is `postalCode` (as used throughout the codebase in `package_receiving_address`). So it never finds a match and the postal code is never displayed.

### Fix — `src/components/dashboard/MultiQuoteSelector.tsx` (line 91)

Change:
```tsx
const zipCode = travelerAddr?.zipCode || travelerAddr?.codigoPostal || null;
```
To:
```tsx
const zipCode = travelerAddr?.postalCode || travelerAddr?.zipCode || travelerAddr?.codigoPostal || null;
```

Add `postalCode` as the first lookup since that's the canonical field name used when saving trip addresses.

### Files
1. `src/components/dashboard/MultiQuoteSelector.tsx` — line 91, add `postalCode` to field lookup

