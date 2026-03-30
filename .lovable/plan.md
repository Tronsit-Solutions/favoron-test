

## Abrir hoja completa de notificaciones

### Problema
El dropdown de notificaciones solo carga 20 items (`limit(20)`) y el botón "Ver todas las notificaciones" no hace nada. No hay scroll infinito ni paginación.

### Solución
Crear un **Sheet** (panel lateral) que se abra al hacer clic en "Ver todas las notificaciones", con scroll infinito para cargar más notificaciones.

### Cambios

**1. Nuevo componente `NotificationSheet.tsx`**
- Sheet lateral con lista completa de notificaciones
- Paginación con "cargar más" (load more) — carga de 20 en 20
- Mismo diseño de cada notificación que el dropdown
- Botón "Marcar todas como leídas"
- Filtros simples: Todas / No leídas

**2. Modificar `useNotifications.tsx`**
- Agregar función `fetchMore()` que carga la siguiente página usando `.range(offset, offset+19)`
- Agregar estado `hasMore` para saber si hay más notificaciones
- Mantener el `limit(20)` inicial para el dropdown

**3. Modificar `notification-dropdown.tsx`**
- El botón "Ver todas las notificaciones" abre el Sheet (estado controlado)
- Cerrar el popover al abrir el sheet

### Archivos
| Archivo | Acción |
|---|---|
| `src/components/ui/NotificationSheet.tsx` | Crear |
| `src/hooks/useNotifications.tsx` | Agregar `fetchMore`, `hasMore` |
| `src/components/ui/notification-dropdown.tsx` | Conectar botón al Sheet |

