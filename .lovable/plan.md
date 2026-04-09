

## Add Address from Profile Tab

Currently, the **Saved Addresses** section in the profile tab only shows, deletes, and sets default addresses. Users can only add addresses when accepting a delivery quote. This plan adds the ability to create new addresses directly from the profile.

### What will change

**File: `src/components/profile/SavedAddressesSection.tsx`**

1. Add an "Agregar dirección" button at the top of the section (next to the card header or as a CTA when no addresses exist).
2. Add an inline form (toggled by state) with the same fields used in `DeliveryAddressSheet`:
   - Dirección completa (streetAddress) - required
   - Ciudad/Municipio (cityArea) - required, free text input
   - Referencia / Condominio / Edificio (hotelAirbnbName) - optional
   - Número de contacto (contactNumber) - required
   - Etiqueta (label): Casa / Oficina / Otro selector
3. On save, generate a UUID, append to the existing addresses array, and persist via `updateAddresses()`. If it's the first address, auto-set as default.
4. Add an edit capability: clicking an address opens the same form pre-filled, allowing users to modify and save changes.

### Technical details

- Reuse the existing `updateAddresses` helper and `SavedAddress` interface already in the file.
- The form toggles via a `showForm` state; an `editingId` state tracks if editing vs. creating.
- No database schema changes needed -- addresses are stored as JSON in `profiles.saved_addresses`.
- Input validation: require streetAddress, cityArea, and contactNumber before enabling save.
- Label selector uses the same `["Casa", "Oficina", "Otro"]` pattern from `DeliveryAddressSheet`.

