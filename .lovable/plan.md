

## Gestion de Incidencias con Historial de Resolucion

### Situacion actual
- `incident_flag` es un booleano simple: on/off
- Cuando se marca/desmarca, se registra en `admin_actions_log` como `incident_marked` o `incident_unmarked`, pero sin detalles de que paso o como se resolvio
- No hay forma de ver el historial de incidencias ni las notas de resolucion

### Propuesta

Agregar un campo `incident_status` con 3 estados y un flujo de resolucion con notas obligatorias:

```text
Estado          | Significado
----------------|----------------------------------
null/sin flag   | No tiene incidencia
active          | Incidencia activa (como hoy)
resolved        | Incidencia resuelta con registro
```

### Cambios

**1. Base de datos (nueva columna)**
- Agregar `incident_status` (text, nullable) a la tabla `packages` con valores: `'active'` o `'resolved'`
- Agregar `incident_history` (jsonb, default `[]`) para guardar el log estructurado de cada incidencia

Estructura de cada entrada en `incident_history`:
```text
{
  action: 'marked' | 'resolved' | 'reopened',
  timestamp: ISO string,
  admin_id: string,
  admin_name: string,
  reason: string (obligatorio al marcar),
  resolution_notes: string (obligatorio al resolver)
}
```

**2. UI - Modal de resolucion**
- Cuando el admin quiera resolver una incidencia, se abre un modal pidiendo:
  - Notas de resolucion (textarea, obligatorio)
- Al confirmar: `incident_status` cambia a `'resolved'`, `incident_flag` se mantiene en `true`
- Se agrega entrada al array `incident_history`

**3. UI - Marcar incidencia**
- Al marcar una incidencia, pedir razon/descripcion (textarea, obligatorio)
- Se guarda `incident_flag: true`, `incident_status: 'active'`
- Se agrega entrada a `incident_history`

**4. UI - Reabrir incidencia**
- Si una incidencia esta resuelta, permitir reabrir con nota obligatoria
- Cambia `incident_status` de vuelta a `'active'`

**5. UI - Visualizacion en AdminSupportTab**
- Agregar filtro: "Activas" vs "Resueltas" (ademas de los filtros existentes)
- Las resueltas se muestran con badge verde "Resuelta" en vez de rojo "Incidencia"
- Boton para ver el historial completo de la incidencia (timeline)

**6. UI - Timeline de incidencia**
- En el modal de acciones (AdminActionsModal) y en soporte, mostrar una mini-timeline con todas las entradas de `incident_history`: cuando se marco, por que, cuando se resolvio, y las notas de resolucion

**7. Compatibilidad**
- Los paquetes que ya tienen `incident_flag: true` pero no tienen `incident_status` se tratan como `active` por defecto
- La logica de exclusion de pagos sigue usando `incident_flag: true` (no cambia)

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| Migration SQL | Agregar columnas `incident_status` e `incident_history` |
| `AdminActionsModal.tsx` | Reemplazar toggle simple por flujo con modal de razon/resolucion y mostrar timeline |
| `AdminSupportTab.tsx` | Agregar filtros activas/resueltas, badges diferenciados, boton de ver historial |
| `OperationsTripCard.tsx` | Actualizar boton de incidencia para pedir razon |
| `useOperationsData.tsx` | Agregar `incident_status` e `incident_history` a las interfaces y queries |
| Nuevo: `IncidentReasonModal.tsx` | Modal reutilizable para capturar razon (al marcar) o notas de resolucion (al resolver) |
| Nuevo: `IncidentTimeline.tsx` | Componente que renderiza el historial de incidencia como timeline visual |

### Flujo resumido

```text
[Marcar incidencia]
  -> Modal pide razon
  -> incident_flag=true, incident_status='active'
  -> Se agrega a incident_history

[Resolver incidencia]
  -> Modal pide notas de resolucion
  -> incident_status='resolved' (incident_flag sigue true)
  -> Se agrega a incident_history
  -> Paquete sale del filtro "activas" pero queda visible en "resueltas"

[Reabrir]
  -> Modal pide razon
  -> incident_status='active'
  -> Se agrega a incident_history
```

