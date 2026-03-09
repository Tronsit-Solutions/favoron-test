

## Rediseño del TripTipsModal

### Estructura nueva del modal (de arriba a abajo)

1. **Header** -- "Tips del Viaje" + ruta (sin cambios)

2. **Total de tips pagados por shoppers** -- Suma de los tips (`getActiveTipFromPackage`) de TODOS los paquetes asignados al viaje (no solo los entregados). Esto reemplaza el "Total acumulado" actual que muestra el monto del acumulador (que puede ser Q0 si no se ha inicializado).

3. **Progreso de entrega** -- Barra de progreso (sin cambios significativos)

4. **Listado de paquetes** -- Expandir la query para incluir TODOS los estados activos del viaje: `quote_sent`, `payment_pending`, `quote_accepted`, `paid`, `pending_purchase`, `purchase_confirmed`, `shipped`, `in_transit`, `received_by_traveler`, `delivered_to_office`, `completed`, `ready_for_pickup`, `ready_for_delivery`, `pending_office_confirmation`. Usar `getStatusLabel` del proyecto para las etiquetas de estado.

5. **Botón "Solicitar cobro"** -- Siempre visible al fondo. **Deshabilitado** (con tooltip/mensaje) hasta que todos los paquetes estén entregados. Eliminar la lógica que oculta el botón y la de "Inicializar pagos" -- el acumulador se creará automáticamente al solicitar cobro si no existe.

### Cambios en archivo

**`src/components/dashboard/TripTipsModal.tsx`**
- Calcular `totalTips` sumando `getActiveTipFromPackage` de todos los paquetes (no del acumulador)
- Ampliar `eligibleStatuses` para incluir todos los estados activos
- Agregar más estados al mapa `getStatusLabel`
- Botón siempre renderizado con `disabled={!isAllDelivered || accumulatedAmount <= 0}` y crear acumulador on-the-fly si no existe al hacer click
- Mostrar mensaje debajo del botón deshabilitado explicando por qué está bloqueado

