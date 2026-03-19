

## Agregar Boost Code al formulario de registro de viaje (TripForm)

### Concepto
Agregar un campo opcional de "Código de Tip Boost" en el Step 4 (resumen/confirmación) del TripForm, antes del checkbox de términos y condiciones. El código se guarda como parte del `submitData` y se valida/aplica después de crear el viaje.

### Cambios

1. **`src/components/TripForm.tsx`**
   - Agregar estado `boostCode` al form data (string, opcional)
   - En Step 4 (renderStep4), agregar un campo de input para el código de boost antes del checkbox de T&C, con icono de Rocket y estilo sutil
   - Incluir `boostCode` en el `submitData` enviado al submit

2. **`src/hooks/useDashboardActions.tsx`** (o donde se procese `handleTripSubmit`)
   - Después de crear el viaje exitosamente, si `boostCode` tiene valor, llamar a `supabase.rpc('validate_boost_code')` con el trip_id recién creado y el traveler_id
   - Mostrar toast de éxito/error según resultado

### UX
- Campo opcional, no bloquea el submit si está vacío
- Placeholder: "Ej: BOOST10 (opcional)"
- Texto de ayuda: "¿Tienes un código de boost? Ingresalo para aumentar tus ganancias"
- Si el código es inválido, se muestra error pero el viaje se crea igual (el boost simplemente no se aplica)

### Archivos a modificar
- `src/components/TripForm.tsx` (agregar campo en Step 4)
- `src/hooks/useDashboardActions.tsx` (validar boost code post-creación del viaje)

