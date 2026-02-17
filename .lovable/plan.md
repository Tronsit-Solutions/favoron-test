

## Gestion de Incidencias con Historial de Resolucion — IMPLEMENTADO ✅

### Cambios realizados

1. **Base de datos**: Columnas `incident_status` (text) e `incident_history` (jsonb) agregadas a `packages`
2. **RPC**: `get_all_operations_data` actualizada para retornar los nuevos campos
3. **IncidentReasonModal.tsx**: Modal reutilizable para capturar razón (marcar), resolución (resolver) o reapertura
4. **IncidentTimeline.tsx**: Componente visual tipo timeline para mostrar historial de incidencias
5. **AdminActionsModal.tsx**: Toggle simple reemplazado por flujo con modal + timeline
6. **AdminSupportTab.tsx**: Filtros separados "Incidencias Activas" y "Resueltas" con badges diferenciados
7. **OperationsReceptionTab.tsx**: Al marcar incidencia desde operaciones, se guarda con status e historial
8. **useOperationsData.tsx**: Interfaces y transformación de datos actualizadas

### Compatibilidad
- Paquetes existentes con `incident_flag=true` se tratan como `active` por defecto (backfill ejecutado)
- La lógica de exclusión de pagos sigue usando `incident_flag: true` (sin cambios)
