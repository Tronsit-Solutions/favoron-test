

## Fix: No se puede seleccionar viajeros en AdminMatchDialog

### Causa raíz

El `useEffect` en la línea 408 de `AdminMatchDialog.tsx` tiene `availableTrips` en su array de dependencias. Como `availableTrips` es un array que se recrea en cada render del componente padre, este efecto se re-ejecuta constantemente. Las primeras líneas del efecto son:

```ts
setSelectedTripIds(new Set());  // ← BORRA la selección
setSelectedTripId(null);        // ← BORRA la selección
```

**Resultado**: cada vez que el componente padre re-renderiza, la selección del usuario se borra inmediatamente.

### Solución

**Archivo: `src/components/admin/AdminMatchDialog.tsx`**

1. **Separar el reset de la selección del fetch de assignments**: Mover `setSelectedTripIds(new Set())` y `setSelectedTripId(null)` a un efecto que solo dependa de `selectedPackage?.id` (cuando cambia el paquete seleccionado), NO de `availableTrips`.

2. **Estabilizar la dependencia de `availableTrips`**: Usar `useRef` para almacenar los IDs de los trips y solo re-ejecutar el fetch cuando los IDs realmente cambien (comparación por valor, no por referencia).

```tsx
// Efecto de RESET — solo cuando cambia el paquete
useEffect(() => {
  setShowAllTrips(false);
  setShowOtherCities(false);
  setSelectedTripIds(new Set());
  setSelectedTripId(null);
}, [selectedPackage?.id]);

// Efecto de FETCH — cuando se abre el dialog o cambian datos relevantes
useEffect(() => {
  if (!showMatchDialog || !selectedPackage?.id) {
    setAlreadyAssignedTripIds(new Set());
    setTripAssignmentsMap({});
    return;
  }
  // ... fetch logic sin resetear selección
}, [selectedPackage?.id, showMatchDialog, availableTrips]);
```

### Resultado esperado
- El usuario puede seleccionar viajeros sin que la selección se borre
- El fetch de assignments sigue funcionando correctamente cuando cambian los datos

