

## Agregar botón "Rechazar cotización" para shoppers

### Contexto
Cuando solo hay 1 cotización, el shopper no tiene opción de rechazarla. Queremos agregar un botón que permita rechazar todas las cotizaciones y devolver el paquete a `approved` para buscar nuevos viajeros.

### Cambios

**1. `src/components/dashboard/MultiQuoteSelector.tsx`**
- Agregar prop `onRejectAllQuotes: () => Promise<void>` al componente.
- Debajo del botón "Aceptar esta cotización", agregar un botón secundario/outline "Rechazar y buscar más viajeros" (con ícono `X`). Solo visible cuando hay cotizaciones (`quotedAssignments.length > 0`).
- Incluir un `AlertDialog` de confirmación: "¿Estás seguro? El paquete volverá a buscar nuevos viajeros y las cotizaciones actuales se descartarán."

**2. `src/components/dashboard/CollapsiblePackageCard.tsx`**
- Agregar prop `onRejectAllQuotes?: (packageId: string) => Promise<void>` al componente.
- Pasar `onRejectAllQuotes={() => onRejectAllQuotes(pkg.id)}` al `MultiQuoteSelector` en ambos lugares donde se renderiza (inline y modal).

**3. `src/components/Dashboard.tsx`**
- Implementar `handleRejectAllQuotes(packageId)`:
  1. Actualizar todas las `package_assignments` activas del paquete a `status = 'bid_lost'`.
  2. Actualizar el paquete: `status = 'approved'`, `matched_trip_id = null`.
  3. Mostrar toast de confirmación.
  4. Refrescar datos.
- Pasar `onRejectAllQuotes={handleRejectAllQuotes}` al `CollapsiblePackageCard`.

### Notas
- No se necesitan migraciones de base de datos; las operaciones son UPDATEs a tablas existentes con campos existentes.
- El estado `bid_lost` ya existe para asignaciones descartadas, se reutiliza.

