

## Fix: Refrescar assignments después de editar tips/cotización

### Problema
Cuando el admin edita el tip (de Q200 a Q275), los datos se guardan correctamente en `packages` y se sincronizan a `package_assignments` (fix anterior). Sin embargo, los **cards de viajeros asignados** en el modal siguen mostrando Q200 porque:

1. `packageAssignments` se carga una sola vez al abrir el modal (useEffect línea 373)
2. Después de guardar tips, solo se llama `refetchPackageDetails()` (que re-carga datos del paquete), pero **no se re-cargan los assignments**
3. El dashboard "Mis Viajes" del viajero lee de `package_assignments` — la sync ya se implementó, pero hay que verificar que el componente `CollapsibleTravelerPackageCard` lea el campo actualizado

### Cambios

**1. `src/components/admin/PackageDetailModal.tsx`**

Extraer la lógica de carga de assignments (líneas 374-421) a una función reutilizable (`loadAssignments`) y llamarla también en el `onSuccess` del `QuoteEditModal` y después de cualquier acción que modifique tips.

- Convertir el bloque dentro del `useEffect` (línea 374) en una función nombrada fuera del effect
- En el `useEffect`, seguir llamando esa función
- En `onSuccess` del `QuoteEditModal` (línea 3120): agregar llamada a `loadAssignments()`
- En `handleSaveChanges` (línea 832): agregar llamada a `loadAssignments()` si `products_data` fue editada

**2. Verificar `CollapsibleTravelerPackageCard.tsx`**

El componente ya lee `admin_assigned_tip` y `products_data` del objeto `pkg` que recibe. Si el dashboard del viajero suscribe a cambios realtime en `package_assignments`, los valores se actualizarán automáticamente gracias al sync ya implementado. Solo hay que confirmar que el realtime subscription está activo para esa tabla.

### Resultado
- Cards de viajeros asignados mostrarán el tip correcto inmediatamente después de editar
- Dashboard "Mis Viajes" del viajero mostrará el tip actualizado via realtime

