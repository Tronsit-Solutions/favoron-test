

## Fix: Country not showing due to case mismatch

The package `#7320d5` has `package_destination_country = "guatemala"` (lowercase) in the database, but the Select options use `"Guatemala"` (capitalized). Radix Select requires an exact match, so it shows "Selecciona el país" instead.

Some older packages were saved with lowercase slugs while newer ones use proper labels. The fix needs to handle both cases.

### Change in `src/components/dashboard/EditPackageModal.tsx`

Normalize the `packageDestinationCountry` value when initializing state. Add a mapping function that converts known slugs to their label equivalents:

```typescript
// Normalize country value to match Select options
const normalizeCountry = (val: string): string => {
  if (!val) return '';
  const mapping: Record<string, string> = {
    'guatemala': 'Guatemala',
    'estados_unidos': 'Estados Unidos',
    'estados unidos': 'Estados Unidos',
    'espana': 'España',
    'españa': 'España',
    'mexico': 'México',
    'méxico': 'México',
  };
  return mapping[val.toLowerCase()] || 
    destinationCountries.find(c => c.value.toLowerCase() === val.toLowerCase())?.value || 
    val;
};
```

Apply this normalization in three places:
1. Initial `useState` for `packageDestinationCountry`
2. The `useEffect` reset when `pkg` changes
3. The `handleResetChanges` function

This ensures any legacy lowercase/slug values from the DB are correctly matched to the capitalized Select options without needing a DB migration.

