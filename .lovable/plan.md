
# Plan: Actualizar Edge Function con Filtro de Incidencias

## Objetivo
Actualizar la edge function `recalculate-trip-accumulator` para excluir paquetes con `incident_flag: true` del cálculo del acumulador de pagos, permitiendo que Jorge (y otros viajeros) puedan cobrar sin que los paquetes con incidencias bloqueen el proceso.

## Cambios Técnicos

### Archivo: `supabase/functions/recalculate-trip-accumulator/index.ts`

#### Cambio 1: Query de paquetes completados (líneas 43-48)
Agregar `incident_flag` al select y filtrar paquetes sin incidencia:

```typescript
// ANTES
.select('id, quote, status, office_delivery')
.eq('matched_trip_id', tripId)
.in('status', ['completed', 'delivered_to_office'])
.not('quote', 'is', null);

// DESPUÉS
.select('id, quote, status, office_delivery, incident_flag')
.eq('matched_trip_id', tripId)
.in('status', ['completed', 'delivered_to_office'])
.not('quote', 'is', null)
.or('incident_flag.is.null,incident_flag.eq.false');
```

#### Cambio 2: Query de total de paquetes (líneas 85-89)
Agregar `incident_flag` al select y filtrar:

```typescript
// ANTES
.select('id, status')
.eq('matched_trip_id', tripId)
.in('status', eligibleStatuses);

// DESPUÉS
.select('id, status, incident_flag')
.eq('matched_trip_id', tripId)
.in('status', eligibleStatuses)
.or('incident_flag.is.null,incident_flag.eq.false');
```

## Resultado Esperado para Jorge

| Métrica | Antes | Después |
|---------|-------|---------|
| `accumulated_amount` | Q450 | Q450 |
| `delivered_packages_count` | 6 | 6 |
| `total_packages_count` | 7 | **6** |
| `all_packages_delivered` | false | **true** |

## Pasos de Implementación

1. Modificar la edge function con los filtros de `incident_flag`
2. Desplegar la edge function actualizada
3. Llamar a la función con el trip ID de Jorge (`d10528c5-ab5b-4eed-8baf-6d189106e39b`)
4. Verificar que el acumulador se actualizó correctamente

## Consistencia con Frontend
Este cambio alinea la lógica del backend con:
- `useCreateTripPaymentAccumulator.tsx` (ya tiene el filtro)
- `Dashboard.tsx` (actualizado en el último cambio)
