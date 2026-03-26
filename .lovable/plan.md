

## Diagnóstico: Carga lenta de "Asignaciones del Viaje"

### Causa
No hay indicador de carga (loading state). Cuando el admin hace clic en un viajero, se inicializa `tripAssignments = []` y se muestra inmediatamente "No hay asignaciones para este viaje" mientras la query aún está en curso. Esto da la impresión de que tarda o que no hay datos.

Las 3 queries (referral, packages, assignments) ya corren en paralelo con `Promise.all`, así que no hay waterfall. El problema es puramente de **percepción** por falta de feedback visual.

### Solución
Agregar un estado `loadingAssignments` que muestre un spinner/skeleton mientras la query de assignments está en curso.

### Cambios en `src/components/admin/AdminMatchDialog.tsx`

1. **Nuevo estado**: `const [loadingAssignments, setLoadingAssignments] = useState(false);`

2. **En `handleTravelerClick`** (línea ~573): Setear `setLoadingAssignments(true)` al inicio. En el `assignmentsPromise` (línea ~687), agregar `finally { setLoadingAssignments(false) }`.

3. **En la UI** (línea ~2047): Antes del check de `length === 0`, verificar `loadingAssignments` y mostrar un spinner o skeleton:
   ```
   {loadingAssignments ? (
     <div className="text-center py-6">
       <Loader2 className="animate-spin mx-auto" />
       <p>Cargando asignaciones...</p>
     </div>
   ) : tripAssignments.length === 0 ? (
     ...empty state...
   ) : (
     ...list...
   )}
   ```

### Archivo a modificar
- `src/components/admin/AdminMatchDialog.tsx` (3 cambios menores)

