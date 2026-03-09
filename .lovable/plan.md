

## Plan: Implementar status 'expired' para viajes

### 1. Migración de base de datos

**Actualizar CHECK constraint** para agregar `'expired'` y `'cancelled'` (actualmente solo tiene: `pending_approval, approved, active, completed_paid, rejected`):

```sql
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_status_check;
ALTER TABLE public.trips ADD CONSTRAINT trips_status_check 
CHECK (status IN (
  'pending_approval', 'approved', 'active', 'completed_paid', 'rejected', 'cancelled', 'expired'
));
```

**Crear función DB `expire_trips_without_paid_packages`** que:
- Busca viajes con status `approved` cuya fecha `last_day_packages` (o `arrival_date` como fallback) ya pasó
- Verifica que no tengan paquetes con statuses activos/pagados (excluye `cancelled`, `rejected`, `expired`, `deadline_expired`, `quote_expired`)
- Cambia su status a `expired`
- Retorna conteo de viajes expirados

```sql
CREATE OR REPLACE FUNCTION expire_trips_without_paid_packages()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  WITH trips_to_expire AS (
    SELECT t.id
    FROM trips t
    WHERE t.status = 'approved'
      AND COALESCE(t.last_day_packages, t.arrival_date)::date < CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM packages p
        WHERE p.matched_trip_id = t.id
          AND p.status NOT IN ('cancelled', 'rejected', 'deadline_expired', 'quote_expired', 'pending_approval')
      )
  )
  UPDATE trips SET status = 'expired', updated_at = now()
  WHERE id IN (SELECT id FROM trips_to_expire);
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN jsonb_build_object('expired_count', expired_count);
END;
$$;
```

### 2. Integrar en edge function existente `expire-quotes`

Agregar una llamada a la nueva función DB al final del flujo existente (junto a `expire_old_quotes` y `expire_approved_deadlines`):

```typescript
// Expire trips without paid packages past their reception window
const { data: tripsData, error: tripsError } = await supabase.rpc('expire_trips_without_paid_packages');
```

No se necesita cron job separado ya que `expire-quotes` ya corre cada hora.

### 3. Actualizar frontend

**`src/components/Dashboard.tsx`** (~línea 258): Agregar `'expired'` a los statuses filtrados:
```tsx
if (trip.status === 'rejected' || trip.status === 'cancelled' || trip.status === 'expired') return false;
```

**`src/utils/statusHelpers.ts`**: Agregar label para `expired`:
```tsx
expired: { label: 'Expirado', variant: 'secondary' },
```

**`src/components/admin/matching/AvailableTripsTab.tsx`**: El filtro existente ya excluye viajes expirados (solo muestra `approved`/`active` con fecha futura), no requiere cambios.

### Resumen de archivos a modificar
- Nueva migración SQL (constraint + función DB)
- `supabase/functions/expire-quotes/index.ts` — agregar llamada a nueva función
- `src/components/Dashboard.tsx` — filtrar viajes expired
- `src/utils/statusHelpers.ts` — agregar label

