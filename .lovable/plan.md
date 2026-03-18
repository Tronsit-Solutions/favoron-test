

## Agregar dirección de entrega en un Sheet lateral desde el MultiQuoteSelector

### Problema
Cuando el shopper selecciona "Entrega a domicilio" en el modal de cotizaciones, no puede agregar ni editar su dirección de entrega. Meter un formulario completo dentro del modal lo haría demasiado grande.

### Solución
Usar un **Sheet** (panel lateral deslizante) que se abre cuando el shopper selecciona "Entrega a domicilio", permitiendo ingresar/editar la dirección sin agrandar el modal.

### Cambios

**1. `src/components/dashboard/MultiQuoteSelector.tsx`**
- Agregar estado local `deliveryAddress` (inicializado desde `packageDetails.confirmedDeliveryAddress` si existe)
- Agregar estado `showAddressSheet` (boolean)
- Cuando `selectedDeliveryMethod === 'delivery'`: mostrar un resumen compacto de la dirección (si existe) + botón "Agregar dirección" o "Modificar dirección" que abre el Sheet
- Validar que `deliveryAddress` tenga al menos `streetAddress` y `contactNumber` antes de permitir aceptar (agregar a `canAccept`)
- Pasar `deliveryAddress` en `MultiQuoteAcceptExtras`

**2. Nuevo: `src/components/dashboard/DeliveryAddressSheet.tsx`**
- Sheet lateral (`side="right"`) con el formulario de dirección (mismos campos que `AddressForm.tsx`):
  - Dirección completa (streetAddress) *
  - Ciudad/Municipio (cityArea) * — con dropdown si es Guatemala City o España
  - Referencia/Hotel (hotelAirbnbName) — opcional
  - Teléfono de contacto (contactNumber) *
- Props: `isOpen`, `onClose`, `onSave(addressData)`, `initialData`, `destinationCountry`, `destinationCity`
- Al guardar, llama `onSave` y cierra el Sheet

**3. `src/components/dashboard/MultiQuoteSelector.tsx` — interfaz**
- Agregar `confirmedDeliveryAddress?: any` a `MultiQuotePackageDetails`
- Agregar `deliveryAddress?: object` a `MultiQuoteAcceptExtras`

**4. `src/components/dashboard/CollapsiblePackageCard.tsx`**
- Pasar `confirmedDeliveryAddress: pkg.confirmed_delivery_address` en `packageDetails` al `MultiQuoteSelector`

**5. `src/hooks/useDashboardActions.tsx`**
- En `handleAcceptMultiAssignmentQuote`: si `extras.deliveryAddress` viene, incluir `confirmed_delivery_address` en el update a `packages`

### Flujo UX
1. Shopper selecciona cotización → elige "Entrega a domicilio"
2. Aparece mini-resumen de dirección (o "Sin dirección") + botón "Agregar/Modificar"
3. Click → Sheet se desliza desde la derecha con el formulario
4. Shopper llena → "Confirmar Dirección" → Sheet se cierra, resumen se actualiza
5. Botón "Aceptar cotización" solo se habilita si la dirección está completa

