

## Plan: Separar asignaciones activas de terminales en AdminMatchDialog

### Cambio
En la sección "Asignaciones del Viaje" del `AdminMatchDialog.tsx`, separar las asignaciones en dos grupos:

1. **Activas** (visibles por defecto): `bid_pending`, `bid_submitted`, `bid_won`
2. **Terminales** (colapsadas): `bid_expired`, `bid_cancelled`, `bid_lost`

### Implementación

**Archivo**: `src/components/admin/AdminMatchDialog.tsx` (líneas ~2111-2163)

- Filtrar `tripAssignments` en dos arrays: `activeAssignments` y `terminalAssignments`
- Mostrar `activeAssignments` directamente como están ahora
- Actualizar el contador del header para mostrar solo activas: `Asignaciones del Viaje (X activas)`
- Debajo, agregar un bloque colapsable usando `Collapsible` de shadcn (ya disponible en el proyecto) con texto "Ver X asignaciones expiradas/canceladas" que al expandir muestra las terminales con el mismo formato de card pero más tenue

### Detalle técnico
- Estados terminales: `bid_expired`, `bid_cancelled`, `bid_lost`
- Usar `Collapsible` + `CollapsibleTrigger` + `CollapsibleContent` de `@/components/ui/collapsible`
- El trigger será un botón con icono `ChevronRight` que rota al abrir

