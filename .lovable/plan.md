

## Fix: Modal de detalles de paquete tarda mucho en cargar

### Causa raíz

Cuando se abre el modal `PackageDetailModal`, el spinner "Cargando detalles del paquete..." **bloquea TODO el contenido** hasta que `usePackageDetails` termina. Pero además, hay **4 queries secuenciales** que se disparan al abrir:

1. `usePackageDetails` — 6 columnas JSONB pesadas (products_data, payment_receipt, etc.)
2. `loadPaymentOrder` — query a payment_orders
3. `loadAssignments` — **3 sub-queries secuenciales** (assignments → trips → profiles)
4. `loadRejectionProfiles` — query a profiles

El problema principal: **el modal no muestra nada hasta que la query #1 termina**, y las queries #2-4 ni siquiera empiezan hasta que React re-renderiza con los datos de #1.

### Solución

#### 1) No bloquear el modal entero — mostrar contenido inmediatamente

**Archivo: `src/components/admin/PackageDetailModal.tsx`**

Eliminar el early return con spinner en líneas 499-510. En su lugar, mostrar el modal con los datos "light" (que ya tenemos de `pkgLight`) inmediatamente, y mostrar spinners individuales solo en las secciones que necesitan datos pesados (como products_data).

```tsx
// ANTES (línea 499-510): Early return que bloquea todo
if (loadingDetails) {
  return <Dialog>...<span>Cargando detalles...</span></Dialog>;
}

// DESPUÉS: Eliminar este bloque. Usar pkgLight para renderizar inmediatamente.
// Solo mostrar mini-spinners en secciones específicas que dependen de heavyDetails.
```

#### 2) Paralelizar las queries de assignments

**Archivo: `src/components/admin/PackageDetailModal.tsx`**

En el useEffect de `loadAssignments` (líneas 367-423), las 3 sub-queries (assignments → trips → profiles) son secuenciales. Combinarlas: después de obtener assignments, lanzar trips y profiles en paralelo.

```tsx
// Obtener trips y profiles en paralelo
const [tripsResult, profilesResult] = await Promise.all([
  supabase.from('trips').select('...').in('id', tripIds),
  supabase.from('profiles').select('...').in('id', travelerIdsFromAssignments)
]);
```

Nota: para esto necesitamos extraer los `user_id` de las assignments o trips. Podemos hacer un join directo en la query de assignments para evitar las sub-queries:

```tsx
const { data: assignments } = await supabase
  .from('package_assignments')
  .select(`
    id, package_id, trip_id, status, quote, admin_assigned_tip, 
    traveler_address, matched_trip_dates, products_data, 
    created_at, expires_at, quote_expires_at,
    trips:trip_id (
      id, from_city, to_city, arrival_date, delivery_date,
      first_day_packages, last_day_packages, user_id,
      profiles:user_id (id, first_name, last_name, username, email, phone_number, country_code)
    )
  `)
  .eq('package_id', pkg.id)
  .not('status', 'eq', 'rejected');
```

Esto reduce 3 queries a 1 sola con joins.

#### 3) Merge light data sin esperar heavy details

**Archivo: `src/components/admin/PackageDetailModal.tsx`**

Cambiar la lógica de merge (línea 220) para no requerir que heavyDetails exista:

```tsx
// ANTES: Solo se usa pkgLight si heavyDetails existe
const pkg = pkgLight && heavyDetails ? { ...pkgLight, ...heavyDetails } : pkgLight;

// DESPUÉS: Siempre usar pkgLight, merge heavy cuando llegue
const pkg = pkgLight ? { ...pkgLight, ...(heavyDetails || {}) } : null;
```

### Archivos a modificar
- `src/components/admin/PackageDetailModal.tsx` — eliminar early return bloqueante, usar join en assignments query, merge inmediato
- `src/hooks/usePackageDetails.tsx` — sin cambios (la query en sí es rápida, el problema es el bloqueo de UI)

### Resultado esperado
- El modal se abre **inmediatamente** con datos básicos (nombre, estado, shopper, etc.)
- Las secciones pesadas (productos, documentos) se cargan con spinners individuales
- Las assignments se cargan en 1 query en vez de 3

