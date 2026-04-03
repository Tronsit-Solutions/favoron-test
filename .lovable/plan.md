
## Fix: acelerar la carga de “Asignaciones del Viaje” en el modal de viajero del match

### Qué está pasando
En `src/components/admin/AdminMatchDialog.tsx`, al abrir el perfil del viajero (`handleTravelerClick`) se disparan varias consultas para poblar dos bloques a la vez:

- `Paquetes en este Viaje`
- `Asignaciones del Viaje`

Aunque las queries están parcialmente paralelizadas, la sección de asignaciones sigue dependiendo de una carga “pesada”:
1. trae todas las asignaciones del viaje,
2. extrae todos los `package_id`,
3. vuelve a consultar `packages` para esos ids,
4. además hace join con `profiles`.

Eso provoca que:
- el modal abra rápido pero “Asignaciones del Viaje” tarde bastante,
- si el segundo fetch se atrasa, la sección queda cargando demasiado tiempo,
- ambas secciones comparten `loadingAssignments`, así que una lenta bloquea visualmente a la otra.

### Causa principal
El cuello de botella no parece ser el render, sino la estrategia de fetch:
- `tripAssignments` se arma en dos pasos dependientes,
- la segunda query pide más datos de `packages` de los que la tarjeta realmente necesita,
- el estado de loading es único para todo el modal del viajero,
- no se aprovecha información que ya existe en memoria (`packages` del admin y `tripAssignmentsMap`) para resolver parte del bloque sin volver a pegarle tanto a Supabase.

### Plan de implementación

#### 1. Separar la carga del modal en dos estados
En `AdminMatchDialog.tsx` dividir:
- `loadingAssignments` en algo como:
  - `loadingTravelerPackages`
  - `loadingTripAssignments`

Así:
- el perfil del viajero abre de inmediato,
- “Paquetes en este Viaje” puede mostrarse antes,
- “Asignaciones del Viaje” puede tener su propio spinner/error sin bloquear todo.

#### 2. Reducir la query de asignaciones del viaje
Cambiar el bloque de `handleTravelerClick` para que la consulta de `package_assignments` siga siendo la fuente de verdad, pero con enriquecimiento más liviano:

- Query 1:
  - `package_assignments` por `trip_id`
  - solo columnas necesarias para la card:
    - `id, package_id, status, admin_assigned_tip, quote, created_at`

- Query 2:
  - resolver detalles del paquete de forma más barata:
    - primero reusar `packages` ya cargados en el dashboard para los `package_id` disponibles,
    - solo consultar a Supabase los `package_id` faltantes,
    - pedir campos mínimos:
      - `id, item_description, estimated_price, purchase_origin, package_destination, user_id`

- Query 3:
  - perfiles solo para shoppers faltantes de esos paquetes faltantes, en batch.

Esto elimina trabajo redundante y reduce el peso del segundo fetch.

#### 3. Construir índices memoizados para reutilizar datos ya cargados
Agregar en `AdminMatchDialog.tsx` índices memoizados con los datos ya disponibles:
- `packagesById`
- `profilesByUserId` para shoppers cuando existan en `pkg.profiles`

Objetivo:
- si un assignment apunta a un paquete ya presente en `packages`, la tarjeta se construye sin fetch extra,
- solo se consulta Supabase para paquetes realmente ausentes del estado admin.

#### 4. Mantener cache granular por viaje
El `travelerDataCacheRef` ya existe, pero hoy cachea el resultado final completo.
Extender el enfoque para que:
- cachee por separado `travelerPackages` y `tripAssignments`,
- si una parte ya está disponible, se pinte primero,
- si la otra sigue cargando, no se pierda lo ya renderizado.

#### 5. Mejorar feedback y fallback visual
En la sección “Asignaciones del Viaje”:
- mantener spinner propio,
- mostrar mensaje de timeout específico si esa sección tarda demasiado,
- agregar botón “Reintentar” solo para recargar asignaciones del viaje,
- conservar las asignaciones viejas en pantalla si existe cache previa y se está refrescando en segundo plano.

### Archivos a tocar
- `src/components/admin/AdminMatchDialog.tsx`

### Resultado esperado
- abrir el perfil del viajero se sentirá mucho más inmediato,
- “Asignaciones del Viaje” dejará de depender de una cascada pesada,
- menos consultas redundantes a `packages` y `profiles`,
- mejor resiliencia cuando Supabase responde lento,
- la UI mostrará progreso real en vez de quedarse “pegada” cargando.

### Detalle técnico
```text
Antes:
click viajero
  -> referral
  -> packages directos
  -> assignments del viaje
  -> packages de assignments
  -> profiles de shoppers implícitos
  -> recién entonces se arma tripAssignments

Después:
click viajero
  -> abrir modal inmediato
  -> cargar travelerPackages y tripAssignments por separado
  -> reusar packages ya presentes en memoria
  -> consultar solo faltantes
  -> spinner/retry independiente para Asignaciones del Viaje
```
