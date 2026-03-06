

## Botón de tips acumulados con modal de cobro en TripCard

### Situación actual
- `TripCard` tiene un `TripPaymentSummary` embebido inline (líneas 304-318) que ocupa espacio visual
- También tiene un botón separado "Solicitar Q..." (líneas 244-259)
- Hay duplicación: tanto TripCard como TripPaymentSummary tienen sus propios botones de pago y modales bancarios

### Cambios propuestos

**1. `src/components/dashboard/TripCard.tsx`**
- Eliminar el bloque inline de `TripPaymentSummary` (CardContent, líneas 304-318)
- Eliminar el botón separado "Solicitar" (líneas 244-259)
- Agregar un nuevo botón compacto junto al status badge o en la zona de acciones que muestre el monto acumulado (ej: `💰 Q150.00`) usando datos de `tripPayment` del hook `useTripPayments` ya existente
- El botón abre un nuevo modal `TripTipsModal`

**2. Crear `src/components/dashboard/TripTipsModal.tsx`** (nuevo componente)
- Modal con `Dialog` que muestra:
  - Monto total acumulado de tips
  - Progreso de paquetes entregados (X de Y)
  - Desglose por paquete (descripción + tip) consultando paquetes del viaje
  - Estado del pago si ya fue solicitado (pending/completed)
  - Botón "Solicitar cobro" que abre el `TripBankingConfirmationModal` existente
- El botón de solicitar cobro solo se habilita cuando `tripPayment.all_packages_delivered === true`
- Si no hay accumulator aún pero hay paquetes entregados, mostrar botón "Inicializar pagos" (lógica existente de TripPaymentSummary)

**3. Lógica de visibilidad del botón en TripCard**
- Mostrar el botón cuando: el usuario es dueño del viaje Y hay al menos un paquete en estado post-entrega (usando `hasDeliveredPackages` ya existente) O existe un `tripPayment`
- El botón muestra `Q0.00` si aún no hay acumulador, o el monto real si existe

### Resultado
- La TripCard queda más compacta: solo un botón con el monto
- Toda la información detallada de tips y la acción de cobro viven dentro del modal
- El cobro solo se puede crear cuando todos los paquetes están entregados en oficina

