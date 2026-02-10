

## Busqueda por nombre de viajero + resultados agrupados por viaje

### Cambios

#### 1. Actualizar el RPC `search_operations_packages`

Agregar busqueda por nombre del viajero al WHERE del SQL:

```sql
OR (traveler.first_name || ' ' || traveler.last_name) ILIKE '%' || search_term || '%'
OR traveler.first_name ILIKE '%' || search_term || '%'
OR traveler.last_name ILIKE '%' || search_term || '%'
```

Tambien agregar columnas extra al resultado para poder agrupar:
- `trip_arrival_date` (fecha de llegada del viaje)
- `trip_delivery_date` (fecha de entrega)
- `trip_status` (estado del viaje)

#### 2. Modificar `OperationsSearchTab.tsx` para agrupar por viaje

En lugar de mostrar una lista plana de paquetes, los resultados se agruparan visualmente por viaje:

```text
--- Viaje: Miami -> Guatemala (12 Ene 2026) - Jessica Lopez ---
   [#45] Zapatos Nike - Pagado - Q350.00
   [#46] AirPods Pro  - Completado - Q1,200.00

--- Viaje: Los Angeles -> Guatemala (28 Ene 2026) - Jessica Lopez ---
   [#78] Vitaminas - En transito - Q180.00

--- Sin viaje asignado ---
   [#--] Camiseta - Pagado - Q120.00
```

Cada grupo de viaje mostrara:
- Ruta (origen -> destino)
- Fecha de llegada
- Nombre del viajero
- Los paquetes que pertenecen a ese viaje como sub-cards

Los paquetes sin viaje asignado (`matched_trip_id = null`) se agrupan en una seccion separada al final.

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| Nueva migracion SQL | Actualizar `search_operations_packages`: agregar busqueda por traveler name y columnas extra del viaje |
| `src/components/operations/OperationsSearchTab.tsx` | Agrupar resultados por `matched_trip_id`, mostrar header de viaje con ruta/fecha/viajero, y paquetes anidados debajo. Actualizar placeholder del input para incluir "viajero". Actualizar interface `SearchResult` con los campos nuevos. |

### Detalle tecnico

**Agrupacion en el frontend:**

Despues de recibir los resultados del RPC, se agrupan con un `Map<string | null, SearchResult[]>` usando `matched_trip_id` como clave. Luego se renderizan como cards colapsables similares al `OperationsTripCard` pero en version simplificada (solo lectura, sin botones de confirmar).

**Orden de los grupos:**
1. Viajes ordenados por fecha de llegada (mas reciente primero)
2. Paquetes sin viaje al final

