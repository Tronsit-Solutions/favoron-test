

## Agregar Fecha de Llegada en Columna de Viajes

### Objetivo
Mostrar la fecha de llegada (`arrival_date`) junto con el origen y destino en la columna "Detalle" para los viajes en el Timeline de Actividad.

### Cambios a realizar

#### 1. Modificar el hook `useActivityTimeline`
**Archivo:** `src/hooks/useActivityTimeline.tsx`

- Agregar `arrival_date` al SELECT de trips
- Agregar campo al interface `TripData`
- Agregar campo `arrivalDate` al interface `ActivityItem` (solo para viajes)
- Incluir la fecha de llegada en la descripción del viaje

```typescript
// Interface TripData - agregar:
arrival_date: string | null;

// Interface ActivityItem - agregar campo trip-specific:
arrivalDate?: string | null;

// Query - agregar arrival_date:
.select(`
  id, from_city, to_city, status, created_at, user_id, arrival_date,
  profiles!trips_user_id_fkey (...)
`)
```

#### 2. Modificar el componente `ActivityTimelineTab`
**Archivo:** `src/components/admin/ActivityTimelineTab.tsx`

- Mostrar la fecha de llegada debajo de la ruta para viajes
- Formato: "Los Angeles → Guatemala City" + línea adicional "✈️ Llega: 15 feb 26"

### Resultado visual esperado

**Antes:**
| Tipo | Detalle |
|------|---------|
| Viaje | Los Angeles → Guatemala City |

**Después:**
| Tipo | Detalle |
|------|---------|
| Viaje | Los Angeles → Guatemala City |
|       | ✈️ Llega: 15 feb 26 |

