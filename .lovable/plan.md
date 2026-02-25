

## Agregar pestaña "Viajeros" al Control de Usuarios

### Concepto
Agregar una pestaña dentro de la página de Control de Usuarios (UserManagement) que muestre exclusivamente usuarios que han registrado al menos un viaje. Cada viajero mostrará su rating promedio, total de ratings, tasa de puntualidad, y el admin podrá ver/dejar comentarios.

### Estructura

La vista actual de UserManagement es una sola tabla. Se convertirá en un layout con Tabs:

```text
[Todos los Usuarios] [Viajeros]
```

### Archivos a modificar/crear

**1. Nuevo: `src/components/admin/AdminTravelersTab.tsx`**
- Query a `trips` para obtener IDs únicos de usuarios que han creado al menos un viaje
- Query a `profiles` para obtener datos de esos usuarios (nombre, avatar, email, phone)
- Mostrar columnas: Foto, Nombre, Email, Rating Promedio (estrellas via StarRating), Total Ratings, Tasa Puntualidad, Total Viajes, Acciones
- Los campos `traveler_avg_rating`, `traveler_total_ratings`, `traveler_ontime_rate` ya existen en la tabla `profiles`
- KPI cards arriba: Total Viajeros, Rating Promedio Global, % Puntualidad Promedio
- Botón "Ver Ratings" que abre un modal con los ratings individuales del viajero (query a `traveler_ratings` filtrado por `traveler_id`)
- Campo de notas admin (usando `admin_notes` o un campo inline)
- Búsqueda por nombre/email
- Paginación similar a la existente

**2. Editar: `src/components/admin/UserManagement.tsx`**
- Envolver el contenido actual en `Tabs` con dos pestañas: "Todos los Usuarios" y "Viajeros"
- Importar `AdminTravelersTab`
- El contenido actual va dentro de `TabsContent value="all"`
- El nuevo componente va dentro de `TabsContent value="travelers"`

**3. Nuevo: `src/components/admin/TravelerRatingsDetailModal.tsx`**
- Modal que muestra todos los ratings de un viajero específico
- Lista de ratings con: Shopper, Paquete, Rating, Condición, Puntualidad, Comentario, Fecha
- Reutiliza `StarRating` (readonly)

### Detalle técnico
- Query principal: `SELECT DISTINCT user_id FROM trips` para identificar viajeros, luego batch fetch de profiles
- Los campos de rating (`traveler_avg_rating`, `traveler_total_ratings`, `traveler_ontime_rate`) ya están en `profiles`, se leen directamente
- Para el detalle de ratings: `supabase.from('traveler_ratings').select('*').eq('traveler_id', id)`
- RLS ya permite a admins ver todas las tablas necesarias
- No se necesitan cambios de schema/migraciones

