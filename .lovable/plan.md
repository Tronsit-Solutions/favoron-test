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

## Multi-Traveler Assignment: Traveler Dashboard Integration — Implementado ✅

### Problema
Cuando un admin asigna un paquete a 2+ viajeros, `matched_trip_id` queda `null` en el paquete. El dashboard del viajero solo filtraba por `matched_trip_id`, así que ningún viajero podía ver el paquete.

### Solución implementada

**Modificado: `src/components/Dashboard.tsx`**
- Agregado `useEffect` que consulta `package_assignments` para los trips del usuario
- Filtra assignments cuyo paquete NO tiene `matched_trip_id` apuntando a un trip del usuario (evita duplicados)
- Mapea datos a nivel de assignment (`admin_assigned_tip`, `quote`, `products_data`) sobre el paquete
- Marca paquetes multi-asignados con `_isMultiAssignment: true`
- Fusiona con `assignedPackages` existentes usando `useMemo` con dedup por `id_tripId`

**Modificado: `src/components/dashboard/CollapsibleTravelerPackageCard.tsx`**
- Badge "⚡ Compitiendo" (amber) visible cuando `pkg._isMultiAssignment === true`
- Se muestra junto al status badge existente

### Compatibilidad
- Paquetes single-assignment (con `matched_trip_id` directo) siguen funcionando igual
- RLS de `package_assignments` ya permite SELECT a viajeros con trips propios
