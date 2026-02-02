
# Plan: Excluir Paquetes con Incidencia del Bloqueo de Pagos

## Problema Actual

El sistema de payment accumulator cuenta TODOS los paquetes en tránsito como "pendientes de entrega". El paquete de María Martínez tiene una incidencia (producto cancelado, otro pendiente de confirmar) y está bloqueando los Q450 que Jorge ya tiene listos para cobrar por los 6 paquetes entregados correctamente.

## Solución Propuesta

Modificar la lógica para que los paquetes con `incident_flag: true` sean **excluidos del conteo de paquetes pendientes**, permitiendo al viajero cobrar por los paquetes sin incidencia.

### Comportamiento Nuevo

| Situación | Cuenta en Total? | Cuenta como Entregado? | Suma al Tip? |
|-----------|------------------|------------------------|--------------|
| Paquete normal entregado | Sí | Sí | Sí |
| Paquete normal pendiente | Sí | No | No |
| Paquete con incidencia (cualquier estado) | **No** | **No** | **No** |

Esto significa:
- Los paquetes con incidencia no bloquean el pago
- El tip del paquete con incidencia NO se incluye (se tratará por separado)
- Admin puede resolver la incidencia manualmente después

## Cambios Técnicos

### 1. Hook `useCreateTripPaymentAccumulator.tsx`

Agregar filtro para excluir paquetes con `incident_flag: true` de ambas consultas:

```typescript
// Consulta de paquetes entregados - excluir con incidencia
const { data: completedPackages } = await supabase
  .from('packages')
  .select('id, quote, status, office_delivery, admin_assigned_tip, incident_flag')
  .eq('matched_trip_id', tripId)
  .in('status', ['completed', 'delivered_to_office', 'ready_for_pickup', 'ready_for_delivery'])
  .or('incident_flag.is.null,incident_flag.eq.false');  // NUEVO: excluir incidencias

// Consulta de paquetes totales - excluir con incidencia
const { data: inTransitOrLaterPackages } = await supabase
  .from('packages')
  .select('id, status, incident_flag')
  .eq('matched_trip_id', tripId)
  .in('status', eligibleStatuses)
  .or('incident_flag.is.null,incident_flag.eq.false');  // NUEVO: excluir incidencias
```

### 2. Componente `TripPaymentSummary.tsx`

Actualizar la consulta de conteo para excluir paquetes con incidencia:

```typescript
const { data, error } = await supabase
  .from('packages')
  .select('status, incident_flag')
  .eq('matched_trip_id', trip.id)
  .not('status', 'in', '(rejected,cancelled)')
  .or('incident_flag.is.null,incident_flag.eq.false');  // NUEVO
```

### 3. Mostrar indicador de paquetes con incidencia (opcional)

Agregar un mensaje informativo cuando hay paquetes excluidos por incidencia:

```typescript
// Si hay paquetes con incidencia, mostrar nota
{packagesWithIncident > 0 && (
  <p className="text-xs text-amber-600">
    ⚠️ {packagesWithIncident} paquete(s) con incidencia excluido(s)
  </p>
)}
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useCreateTripPaymentAccumulator.tsx` | Agregar filtro `incident_flag` en ambas consultas |
| `src/components/dashboard/TripPaymentSummary.tsx` | Agregar filtro y mensaje informativo |

## Resultado Esperado

Después de implementar:
1. Jorge podrá crear su orden de cobro por Q450 (6 paquetes entregados)
2. El paquete de María Martínez quedará excluido del conteo
3. Admin podrá resolver la incidencia por separado (confirmar entrega, crear reembolso, etc.)
4. Cuando se quite el `incident_flag`, el paquete volverá a contar normalmente

## Workflow de Incidencias

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. Admin marca paquete con incidencia                       │
│    → incident_flag = true                                   │
├─────────────────────────────────────────────────────────────┤
│ 2. Viajero puede cobrar paquetes sin incidencia             │
│    → Paquete excluido del conteo                            │
├─────────────────────────────────────────────────────────────┤
│ 3. Admin resuelve incidencia:                               │
│    a) Confirma entrega manual → quita flag → suma al tip    │
│    b) Cancela paquete → no suma nada                        │
│    c) Crea reembolso → shopper recibe dinero                │
└─────────────────────────────────────────────────────────────┘
```
