

## Agregar comentarios a incidencias

Permitir agregar comentarios/notas a las tarjetas de incidencias sin cambiar su estado (resolver/reabrir).

### Cambios

**`src/components/admin/IncidentReasonModal.tsx`**:
- Agregar una nueva acción `'comment'` al tipo `IncidentAction` y al `actionConfig` con título "Agregar Comentario", placeholder apropiado, icono `MessageSquare`, y botón con variant `outline`

**`src/components/operations/OperationsIncidentsTab.tsx`**:
- En el `PackageCard`, agregar un botón "Comentar" (icono `MessageSquare`) al lado del botón de Resolver/Reabrir
- En `handleIncidentAction`, manejar el caso `'comment'`: crear una entrada de historial con `action: 'comment'` y `note: text`, sin cambiar el `incident_status` actual del paquete
- Solo actualizar `incident_history` en la base de datos (no modificar `incident_status`)

### Resultado
Cada tarjeta de incidencia tendrá un botón "Comentar" que abre el modal, permite escribir una nota, y la agrega al historial sin alterar el estado de la incidencia. Los comentarios aparecerán en la línea de tiempo existente (`IncidentTimeline`).

