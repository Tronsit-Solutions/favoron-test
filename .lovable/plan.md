
## Alerta de fecha limite vencida en pedidos aprobados

### Que se hara
Cuando un pedido en estado `approved` ya supero su `delivery_deadline`, mostrar al shopper un mensaje indicando que no se logro encontrar un viajero a tiempo, con un boton para reprogramar la fecha limite directamente desde su dashboard.

### Cambios

**1. `src/components/dashboard/shopper/ShopperPackagePriorityActions.tsx`**

En el case `'approved'` (linea 128), agregar logica para detectar si `delivery_deadline` ya paso:

- Si `delivery_deadline < now()`:
  - Titulo: "Fecha limite vencida"
  - Descripcion: "No logramos encontrar un viajero disponible antes de tu fecha limite. Puedes reprogramar una nueva fecha para seguir buscando."
  - Boton: "Reprogramar fecha limite" que abre un mini-modal/popover con un calendario
- Si no ha vencido: mantener el comportamiento actual ("Pedido aprobado, pendiente de viajero")

**2. Nuevo estado local en `ShopperPackagePriorityActions.tsx`**

- `showRescheduleDialog` (boolean) para controlar un AlertDialog con un DatePicker
- Al confirmar la nueva fecha, hacer `supabase.update` del campo `delivery_deadline` en la tabla `packages`
- Mostrar toast de confirmacion y llamar `onRefresh()`

**3. UI del dialogo de reprogramacion**

- AlertDialog con titulo "Reprogramar fecha limite"
- Calendar/DatePicker para seleccionar nueva fecha (solo fechas futuras)
- Boton "Guardar nueva fecha" que actualiza directamente en Supabase
- La fecha minima permitida sera manana (dia siguiente)

### Detalle tecnico

- Se reutiliza el componente `Calendar` existente (`src/components/ui/calendar.tsx`)
- Se usa `AlertDialog` existente para el modal de reprogramacion
- Se usa `Popover` para contener el calendario
- Update directo a `packages.delivery_deadline` via Supabase client
- No requiere cambios en la base de datos ni migraciones
