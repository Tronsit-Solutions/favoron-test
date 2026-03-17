

## Show more address details + blur last name in MultiQuoteSelector

### Changes — `src/components/dashboard/MultiQuoteSelector.tsx`

**1. Blur traveler last name (line 78, 105)**
- Change `travelerName` to show first name + blurred last name:
  ```tsx
  const travelerName = assignment.traveler_first_name || 'Viajero';
  const lastName = assignment.traveler_last_name || '';
  ```
- In the JSX (line 105), render:
  ```tsx
  <p className="text-sm font-semibold truncate">
    {travelerName} <span className="blur-[4px] select-none">{lastName}</span>
  </p>
  ```

**2. Add street line + zip code to address section (lines 122-129)**
- Extract additional fields from `travelerAddr`:
  ```tsx
  const streetLine = travelerAddr?.streetAddress || travelerAddr?.firstAddressLine || null;
  const zipCode = travelerAddr?.zipCode || travelerAddr?.codigoPostal || null;
  ```
- Update the Home row to show city, first line of address, and zip code:
  ```
  🏠 {accommodationType} en {city}
  📍 {streetLine}, CP {zipCode}
  ```
  Use a `MapPin` icon for the street/zip row, separate from the Home row.

### Files
1. `src/components/dashboard/MultiQuoteSelector.tsx`

