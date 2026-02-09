

## Agregar funcionalidad de marcar incidencias desde el Panel de Operaciones

### Resumen

Permitir que el personal de operaciones pueda **marcar paquetes como incidencia** directamente desde el panel de recepción, para que el encargado de incidencias (visible en el Admin Dashboard > Soporte) esté al tanto.

### Arquitectura actual

1. **Base de datos**: El campo `incident_flag` ya existe en la tabla `packages`
2. **Admin Dashboard**: Ya tiene una pestaña "Soporte" que filtra paquetes por `incident_flag = true`
3. **Panel Operaciones**: Actualmente NO tiene acceso a este campo ni forma de modificarlo
4. **RPC `get_all_operations_data`**: NO incluye `incident_flag` en los datos devueltos

### Flujo propuesto

```text
+------------------+     +-------------------+     +--------------------+
| Panel Operaciones|---->| Marcar Incidencia |---->| Admin Dashboard    |
| (staff oficina)  |     | (DB: incident_flag|     | Pestaña Soporte    |
|                  |     |  = true)          |     | (ve incidencias)   |
+------------------+     +-------------------+     +--------------------+
```

### Cambios necesarios

#### 1. Modificar RPC para incluir `incident_flag`

**Archivo:** `supabase/migrations/[nuevo].sql`

Agregar `incident_flag` a la función `get_all_operations_data`:
- Agregar en RETURNS TABLE: `incident_flag boolean`
- Agregar en SELECT: `p.incident_flag`

#### 2. Actualizar tipos en el hook de operaciones

**Archivo:** `src/hooks/useOperationsData.tsx`

Agregar `incident_flag` a las interfaces:
- `OperationsPackage`
- `TripGroupPackage`

Actualizar la transformación de datos del RPC para incluir el campo.

#### 3. Agregar botón de incidencia en cada paquete

**Archivo:** `src/components/operations/OperationsTripCard.tsx`

En el componente `PackageListItem`:
- Agregar botón/icono de "Reportar incidencia" (ícono de alerta ⚠️)
- Mostrar indicador visual si el paquete ya tiene `incident_flag = true`
- Al hacer clic, actualizar el paquete en la base de datos

#### 4. Agregar función para marcar incidencia

**Archivo:** `src/components/operations/OperationsReceptionTab.tsx`

Nueva función `handleMarkIncident`:
- Actualiza `packages.incident_flag = true` vía Supabase
- Registra la acción con `log_admin_action` RPC (si el usuario tiene permiso)
- Muestra toast de confirmación
- Actualiza el estado local para reflejar el cambio

### Detalles de implementación UI

```text
┌─────────────────────────────────────────────────────────────────┐
│ ○ perfume 100ml                                    [⚠️] [Confirmar] │
│   👤 Edison Castillo  ✅ Recibido                                │
│   💰 $208.00  🔗 Ver producto                                    │
└─────────────────────────────────────────────────────────────────┘

Después de marcar incidencia:
┌─────────────────────────────────────────────────────────────────┐
│ ○ perfume 100ml                          [⚠️ Incidencia] [Confirmar] │
│   👤 Edison Castillo  ✅ Recibido                                │
│   💰 $208.00  🔗 Ver producto                                    │
└─────────────────────────────────────────────────────────────────┘
```

- Botón pequeño con icono `AlertTriangle`
- Si ya está marcado: Badge rojo "Incidencia" con opción de desmarcar
- Tooltip explicando la acción

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| Nueva migración SQL | Agregar `incident_flag` al RPC `get_all_operations_data` |
| `src/hooks/useOperationsData.tsx` | Agregar `incident_flag` a interfaces y transformación |
| `src/components/operations/OperationsTripCard.tsx` | Agregar botón/badge de incidencia |
| `src/components/operations/OperationsReceptionTab.tsx` | Agregar handler `handleMarkIncident` |

### Permisos

El usuario de operaciones ya tiene permiso para actualizar paquetes según la política RLS existente:
```sql
Policy: "Operations can confirm office delivery"
Using Expression: has_operations_role(auth.uid()) AND status IN ('in_transit', 'received_by_traveler', 'pending_office_confirmation')
```

Sin embargo, para cambiar `incident_flag` necesitamos verificar que la política permita esta actualización o crear una nueva específica para este campo.

### Resultado esperado

1. Staff de operaciones ve un botón de "⚠️" junto a cada paquete
2. Al hacer clic, el paquete se marca como incidencia con toast de confirmación
3. El paquete muestra un badge rojo "Incidencia" visible
4. En Admin Dashboard > Soporte, el encargado de incidencias ve el paquete listado
5. El encargado puede ver detalles y tomar acciones desde el modal de administración

