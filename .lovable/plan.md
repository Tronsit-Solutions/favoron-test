

## Ajustar EditTripModal: campos opcionales y agregar Tip Boost

### Problema
1. El modal de edición marca como obligatorios campos que en el TripForm original no lo son (o que algunos viajes antiguos no tienen). Actualmente el `validate()` del EditTripModal exige **todos** los campos de dirección, fechas de recepción, etc., lo que impide guardar ediciones simples en viajes que no tenían esos datos.
2. No existe campo de Boost Code en el modal de edición para que el admin pueda asignarlo.

### Cambios

**`src/components/EditTripModal.tsx`**:

1. **Relajar validación** — Hacer opcionales los siguientes campos en `validate()` (líneas 227-234), alineándolos con el TripForm:
   - `accommodationType` → opcional
   - `streetAddress` → opcional  
   - `cityArea` → opcional
   - `postalCode` → opcional
   - `contactNumber` → opcional
   - `recipientName` → opcional
   - `firstDayPackages` → opcional
   - `lastDayPackages` → opcional
   
   Solo mantener como obligatorios: `fromCountry`, `fromCity`, `toCity`, `arrivalDate`, `availableSpace`, `deliveryMethod`, `deliveryDate` (los mismos que Step 1 y Step 3 del TripForm).

   Quitar los asteriscos `*` de los labels de los campos que pasen a opcionales.

2. **Agregar campo Boost Code** — En la sección 4 "Información adicional" (antes del textarea de comentarios), agregar:
   - Input para `boostCode` con icono Rocket, placeholder "Ej: BOOST10", `font-mono`, `toUpperCase()`
   - Inicializar desde `tripData?.boost_code || ''`
   - Incluir `boostCode` en el `submitData` del `handleSubmit`
   - Agregar al `formData` state, `originalFormData`, `hasAnyChanges`, y `handleResetChanges`
   - Importar `Rocket` de lucide-react

3. **Propagar boost_code en el submit handler** — Los componentes que consumen `onSubmit` (en `useDashboardActions` u otros) ya deben manejar el campo `boost_code` al actualizar el viaje en la DB.

### Archivos a modificar
- `src/components/EditTripModal.tsx` (validación, boost code field, state)

