

## Atomic Package Assignment via Postgres RPC

### What we're building

A single Postgres function `assign_package_to_travelers` that replaces the current 3-step client-side process (SELECT active assignments → INSERT new assignments → UPDATE package) with one atomic database call.

### Changes

**1. New SQL Migration — `assign_package_to_travelers` RPC**

```sql
CREATE OR REPLACE FUNCTION public.assign_package_to_travelers(
  _package_id UUID,
  _trip_ids UUID[],
  _admin_tip NUMERIC,
  _products_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_trip_ids UUID[];
  _row RECORD;
  _assignments JSONB := '[]'::jsonb;
BEGIN
  -- 1. Filter out trips that already have active assignments
  SELECT array_agg(tid) INTO _new_trip_ids
  FROM unnest(_trip_ids) AS tid
  WHERE tid NOT IN (
    SELECT trip_id FROM package_assignments
    WHERE package_id = _package_id
      AND status IN ('bid_pending', 'bid_submitted', 'bid_won')
  );

  IF _new_trip_ids IS NULL OR array_length(_new_trip_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'NO_NEW_TRIPS: All selected travelers already have active assignments';
  END IF;

  -- 2. Insert assignment rows (building traveler_address & matched_trip_dates server-side)
  FOR _row IN
    SELECT t.id AS trip_id,
           t.package_receiving_address,
           t.first_day_packages,
           t.last_day_packages,
           t.delivery_date,
           t.arrival_date
    FROM trips t
    WHERE t.id = ANY(_new_trip_ids)
  LOOP
    INSERT INTO package_assignments (
      package_id, trip_id, status, admin_assigned_tip,
      traveler_address, matched_trip_dates, products_data
    ) VALUES (
      _package_id,
      _row.trip_id,
      'bid_pending',
      _admin_tip,
      _row.package_receiving_address,  -- stored as-is from trips
      jsonb_build_object(
        'first_day_packages', _row.first_day_packages,
        'last_day_packages', _row.last_day_packages,
        'delivery_date', _row.delivery_date,
        'arrival_date', _row.arrival_date
      ),
      _products_data
    );
  END LOOP;

  -- 3. Update package to matched status
  UPDATE packages SET
    status = 'matched',
    admin_assigned_tip = _admin_tip,
    traveler_dismissal = NULL,
    traveler_dismissed_at = NULL,
    products_data = COALESCE(_products_data, products_data),
    updated_at = now()
  WHERE id = _package_id;

  -- 4. Return summary
  RETURN jsonb_build_object(
    'assigned_trip_ids', to_jsonb(_new_trip_ids),
    'skipped_count', array_length(_trip_ids, 1) - array_length(_new_trip_ids, 1)
  );
END;
$$;
```

Note: The `traveler_address` field in `package_assignments` stores the raw `package_receiving_address` JSONB from the trip. The client-side `buildTravelerAddress` function currently reshapes field names (e.g., `recipientName`, `streetAddress`). The RPC will store the address as-is from the trips table. We need to verify the existing shape matches — if not, we'll apply the same reshape in SQL. Based on the code, `package_receiving_address` already stores data with those field names, so passing it directly is correct.

**2. Simplify `src/hooks/useDashboardActions.tsx` → `handleMatchPackage`**

Replace lines 1226–1411 with:
- Keep the products_data building logic (lines 1248–1283) — this runs locally
- Replace the SELECT + INSERT + UPDATE block (lines 1286–1357) with a single `supabase.rpc('assign_package_to_travelers', { ... })` call
- Keep the local state update (line 1360–1362)
- Keep the fire-and-forget side effects (lines 1374–1402)
- **Remove the try/catch that swallows errors** — let errors propagate naturally so `AdminDashboard.tsx`'s `.catch()` can trigger rollback
- Keep the tip validation guard (lines 1234–1241) but make it `throw` instead of silent `return`

**3. No changes needed to `AdminDashboard.tsx`** — the rollback logic already exists and will now work because errors propagate.

### Files

| File | Change |
|---|---|
| New migration | Create `assign_package_to_travelers` RPC function |
| `src/hooks/useDashboardActions.tsx` | Replace multi-call match logic with single `.rpc()` call; remove error-swallowing catch |

