

## Fix: Destination pre-selection + Add products feature

### Problem 1: Country/City not showing saved values
The EditPackageModal uses hardcoded country values like `'Guatemala'`, `'España'` but the database stores slugs like `'guatemala'`, `'espana'`, `'estados-unidos'`. The Radix Select can't match them, so dropdowns appear empty.

**Fix**: Replace the hardcoded `destinationCountries` and `citiesByCountry` with the centralized data from `@/lib/countries` (COUNTRY_QUICK_OPTIONS) and `@/lib/cities` (getCitiesByCountry, countryHasCities). This ensures the Select values match what's stored in the DB.

### Problem 2: Can't add more products
Currently the products list is fixed to what was saved. Users should be able to add new products and remove existing ones.

**Fix**: Add an "Agregar producto" button below the products list, and an X button on each product card (disabled if only 1 product remains). New products get empty default values.

### Files to modify
- `src/components/dashboard/EditPackageModal.tsx`:
  - Import `COUNTRY_QUICK_OPTIONS` from `@/lib/countries` and `getCitiesByCountry, countryHasCities` from `@/lib/cities`
  - Replace `destinationCountries` array with `COUNTRY_QUICK_OPTIONS` (using `value`/`label` format)
  - Replace `citiesByCountry` lookup with `getCitiesByCountry(packageDestinationCountry)` call
  - For countries without predefined cities, show a text input instead of Select
  - Add "Agregar producto" button and per-product remove button
  - Update validation to handle dynamic product count

