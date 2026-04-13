

## Plan: Optimizar carga de Asignaciones del Viaje

### Problema
Al hacer click en un viajero en el AdminMatchDialog, se disparan 4 queries paralelas + 1 query secuencial para paquetes faltantes. La query de `allAssignmentsResult` (linea 671-675) trae TODAS las asignaciones del viaje sin filtro de estado ni limite, y luego resuelve cada paquete individualmente. Esto causa latencia notable, especialmente para viajes con historial largo de asignaciones.

### Solucion: RPC server-side con join

Crear una funcion RPC en Supabase que haga el join de `package_assignments` con `packages` y `profiles` en una sola query server-side, eliminando la ronda extra de fetch de paquetes faltantes.

### Cambios

**1. Nueva migracion SQL** — crear RPC `get_trip_assignments_with_packages`

```sql
CREATE OR REPLACE FUNCTION get_trip_assignments_with_packages(p_trip_id UUID)
RETURNS TABLE (
  id UUID,
  package_id UUID,
  status TEXT,
  admin_assigned_tip NUMERIC,
  quote JSONB,
  created_at TIMESTAMPTZ,
  pkg_item_description TEXT,
  pkg_estimated_price NUMERIC,
  pkg_purchase_origin TEXT,
  pkg_package_destination TEXT,
  pkg_user_id UUID,
  shopper_first_name TEXT,
  shopper_last_name TEXT,
  shopper_email TEXT,
  shopper_username TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    pa.id, pa.package_id, pa.status,
    pa.admin_assigned_tip, pa.quote, pa.created_at,
    p.item_description, p.estimated_price,
    p.purchase_origin, p.package_destination, p.user_id,
    pr.first_name, pr.last_name, pr.email, pr.username
  FROM package_assignments pa
  LEFT JOIN packages p ON p.id = pa.package_id
  LEFT JOIN profiles pr ON pr.id = p.user_id
  WHERE pa.trip_id = p_trip_id
  ORDER BY pa.created_at DESC;
$$;
```

**2. Modificar `AdminMatchDialog.tsx`** — reemplazar la query `allAssignmentsResult` + fetch de paquetes faltantes

- Reemplazar la query de linea 671-675 por `supabase.rpc('get_trip_assignments_with_packages', { p_trip_id: trip.id })`
- Eliminar la logica de `allAssignmentPkgIds`, `allMissingIds`, y el fetch secundario de paquetes (lineas 700-719) para las asignaciones — ya viene todo del RPC
- Mapear el resultado del RPC directamente al formato esperado por `tripAssignments`

Esto reduce de 2 roundtrips (assignments + missing packages) a 1 sola llamada server-side con joins.

**3. Tambien usado para `biddingAssignments`** — la query de bidding (linea 665-669) se puede eliminar porque el RPC ya trae todas las asignaciones con su status, y se puede filtrar client-side.

### Resultado
- De 5 queries (4 paralelas + 1 secuencial) a 3 queries (referral, direct packages, RPC assignments) todas en paralelo
- Eliminacion completa del segundo roundtrip de fetch de paquetes
- El join se ejecuta en el servidor, mucho mas rapido que N fetches desde el cliente

