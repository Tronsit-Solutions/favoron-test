

## Fix: Viajeros asignados tardan o no se cargan en el modal de detalles

### Problemas encontrados

**Problema 1 — Condición de visibilidad incorrecta (línea 1342)**
La sección solo se muestra cuando `packageAssignments.length > 0`. Pero si las asignaciones están *cargando*, el array está vacío y la sección completa se oculta — incluyendo el spinner de carga. El usuario nunca ve feedback de que algo está cargando. Si la query falla silenciosamente (catch en línea 412-414 setea `[]`), la sección simplemente no aparece.

**Problema 2 — Query con joins anidados puede fallar silenciosamente**  
La query usa un doble join (`trips:trip_id → profiles:user_id`). Si el join de `profiles` falla (por ejemplo, el `user_id` del trip no tiene perfil), PostgREST puede devolver `null` para todo el objeto `trips`, haciendo que el viajero "desaparezca". Además, no hay timeout ni retry — si la red es lenta, la query se queda colgada indefinidamente.

**Problema 3 — Sin retry automático**  
Si hay un error de red transitorio, el catch silencia el error y deja el array vacío. No hay botón de reintentar visible porque la sección desaparece.

### Cambios propuestos

#### `src/components/admin/PackageDetailModal.tsx`

**1. Corregir condición de visibilidad (línea 1342)**
Mostrar la sección siempre que el paquete esté en fase de competencia O haya asignaciones O esté cargando:

```tsx
// Antes:
{!matchedTrip && packageAssignments.length > 0 && (

// Después:
{!matchedTrip && (
  loadingAssignments || 
  packageAssignments.length > 0 || 
  (pkg.status === 'matched' || pkg.status === 'quote_sent')
) && (
```

**2. Separar la query en dos pasos para evitar fallo silencioso por joins anidados**
Primero traer las asignaciones con el trip, luego traer los perfiles por separado. Esto evita que un join fallido haga desaparecer toda la asignación:

```tsx
// Paso 1: assignments + trips (sin profiles)
const { data: assignments } = await supabase
  .from('package_assignments')
  .select(`id, package_id, trip_id, status, quote, admin_assigned_tip,
           traveler_address, matched_trip_dates, products_data,
           created_at, expires_at, quote_expires_at,
           trips:trip_id (id, from_city, from_country, to_city, to_country,
             arrival_date, delivery_date, first_day_packages, last_day_packages, user_id)`)
  .eq('package_id', pkg.id)
  .not('status', 'eq', 'rejected');

// Paso 2: perfiles en batch
const userIds = [...new Set(assignments.map(a => a.trips?.user_id).filter(Boolean))];
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, first_name, last_name, username, email, phone_number, country_code')
  .in('id', userIds);

// Merge
const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
const enriched = assignments.map(a => ({
  ...a,
  trip: a.trips,
  profile: profileMap[a.trips?.user_id] || null,
}));
```

**3. Agregar timeout + estado de error con botón de reintentar**
Envolver la query en un `Promise.race` con timeout de 8 segundos, y agregar un estado `assignmentsError` que muestre un botón de reintento dentro de la sección visible:

```tsx
{assignmentsError ? (
  <div className="text-center py-4">
    <p className="text-sm text-muted-foreground mb-2">No se pudieron cargar las asignaciones</p>
    <Button variant="outline" size="sm" onClick={loadAssignments}>Reintentar</Button>
  </div>
) : loadingAssignments ? (
  <Loader2 ... />
) : packageAssignments.length === 0 ? (
  <p className="text-sm text-muted-foreground">Sin asignaciones encontradas</p>
) : (
  // lista actual
)}
```

### Resumen
- La sección siempre será visible cuando el paquete está en competencia
- La query es más robusta al separar los joins
- Si falla, el admin verá un botón de reintentar en lugar de un espacio vacío
- Un solo archivo modificado

