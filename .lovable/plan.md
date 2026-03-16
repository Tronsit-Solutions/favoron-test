## Onboarding Bottom Sheet — Implementado ✅

### Cambios realizados

**Nuevo: `src/components/onboarding/OnboardingBottomSheet.tsx`**
- Componente reutilizable con slides tipo bottom-sheet (móvil) / modal centrado (desktop)
- Swipe entre slides con `react-swipeable`
- Dots de navegación clickeables
- Checkbox "No volver a mostrar" en último slide
- Soporte para variantes `shopper` (azul) y `traveler` (verde)
- Gradiente configurable para el hero area

**Modificado: `src/components/PackageRequestForm.tsx`**
- Eliminado Step 0 (intro inline) 
- Agregado `OnboardingBottomSheet` con 4 slides para shoppers
- El formulario ahora siempre empieza en Step 1
- Persiste preferencia en `ui_preferences.skip_package_intro`

**Modificado: `src/components/TripForm.tsx`**
- Eliminado Step 0 (intro inline)
- Agregado `OnboardingBottomSheet` con 4 slides para viajeros
- El formulario ahora siempre empieza en Step 1
- Persiste preferencia en `ui_preferences.skip_trip_intro`

### Contenido de slides

**Shoppers:**
1. "¡Tu primera compra internacional!" — Describe producto y origen
2. "Recibe una cotización" — Incluye propina y tarifa de servicio
3. "Compra tu producto" — Envía a dirección del viajero
4. "¡Recibe tu paquete!" — Oficina o domicilio + mención de impuestos como cargo adicional

**Viajeros:**
1. "¡Conviértete en Viajero!" — Registra viaje con origen, llegada, espacio
2. "Recibe solicitudes" — Decide cuáles aceptar, define propina
3. "Cotiza con confianza" — Impuestos se reembolsan
4. "Entrega y cobra" — Oficina o recolección, pago al completar
