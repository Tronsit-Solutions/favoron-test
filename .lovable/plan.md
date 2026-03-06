

## Revertir confirmaciones de paquetes desde Preparación

### Problema
Al confirmar un paquete por error (RPC `admin_confirm_office_delivery`), el paquete pasa a `delivered_to_office` y desaparece de Recepción. El estado anterior se guarda en `office_delivery.admin_confirmation.previous_status`, lo que permite revertir.

### Solución
Agregar un botón "Revertir" en cada paquete de la pestaña **Preparación** (Ready tab), que devuelve el paquete a su estado anterior.

### Cambios

**1. `src/components/operations/OperationsReadyTab.tsx`**
- Agregar un botón "Revertir" (icono `Undo2`) a cada tarjeta de paquete
- Al hacer clic, leer `office_delivery.admin_confirmation.previous_status` del paquete en DB
- Actualizar el paquete: `status = previous_status`, limpiar `office_delivery.admin_confirmation`
- Recalcular el `trip_payment_accumulator` (UPDATE directo restando el paquete revertido)
- Agregar entrada al `admin_actions_log` documentando la reversión
- Llamar `onRemovePackage` para quitarlo de la vista y `onRefresh` para que reaparezca en Recepción

**2. `src/hooks/useOperationsData.tsx`**
- Exponer `office_delivery` en `OperationsPackage` (ya se tiene `confirmed_delivery_address` pero no `office_delivery`)
- Alternativamente, el componente puede hacer el fetch directo a DB para obtener `office_delivery` al momento de revertir (más simple, sin cambiar el hook)

### Flujo de reversión
1. Usuario presiona "Revertir" en un paquete en Preparación
2. Se muestra un diálogo de confirmación ("¿Seguro que deseas revertir este paquete a Recepción?")
3. Se lee `office_delivery->admin_confirmation->previous_status` de la DB
4. Se actualiza el paquete: `status = previous_status`, se limpia la confirmación
5. Se registra en `admin_actions_log`
6. Se refresca la data para que el paquete reaparezca en Recepción

### Notas técnicas
- No se necesita nuevo RPC; se puede hacer con updates directos ya que operations tiene política de UPDATE en packages
- El `previous_status` ya está almacenado por el RPC de confirmación, solo hay que leerlo

