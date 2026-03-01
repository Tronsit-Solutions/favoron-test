

## Plan: Show free-text municipality field for non-Guatemala departments

### Problem
When the destination country is Guatemala but the selected city/department is NOT "Guatemala" (e.g., Chimaltenango), the AddressForm still shows the Guatemala department municipalities dropdown. Those municipalities only apply to the department of Guatemala.

### Fix

**1. Pass the selected city to AddressForm** — `src/components/PackageRequestForm.tsx` (line 1406-1411)

Add a `destinationCity` prop:
```tsx
<AddressForm
  onSubmit={handleAddressSubmit}
  onCancel={handleAddressCancel}
  initialData={addressData}
  destinationCountry={selectedCountry}
  destinationCity={formData.packageDestination === 'Otra ciudad' ? formData.packageDestinationOther : formData.packageDestination}
/>
```

**2. Update AddressForm to conditionally show dropdown** — `src/components/AddressForm.tsx`

- Add `destinationCity?: string` to the interface
- Change `isGuatemala` logic: only show the municipality dropdown when the destination is Guatemala AND the city/department is "Guatemala City" or "Ciudad de Guatemala". For other Guatemalan departments (Chimaltenango, Quetzaltenango, etc.), use a free-text input instead.

```tsx
const isGuatemalaDepartment = isGuatemala && (
  destinationCity?.toLowerCase().includes('guatemala city') ||
  destinationCity?.toLowerCase().includes('ciudad de guatemala') ||
  !destinationCity
);
const hasDropdown = isGuatemalaDepartment || isSpain;
```

This ensures the municipality dropdown only appears for Guatemala City metro area, and all other Guatemalan departments get a free-text field for their municipality.

