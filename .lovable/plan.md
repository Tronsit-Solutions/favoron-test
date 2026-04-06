

## Plan: Denormalized Traveler Performance Counters

### Problem Analysis

Your instinct is correct: the current approach scans `package_assignments`, `trips`, and `packages` rows every time the admin opens the Trips tab. As data grows, these queries get slower, risk hitting Supabase's 1,000-row limit, and cause the "Failed to fetch" timeouts you're seeing.

However, **a simple counter column has real tradeoffs** that need to be addressed:

### Critical Evaluation of "Counter Column" Approach

**Risks of naive counters:**
1. **Drift** — If a trigger fails, the counter silently becomes wrong. Unlike a `COUNT(*)` query that's always accurate, a counter can desync.
2. **Backfill complexity** — You need a one-time migration to populate existing data correctly.
3. **Multi-status transitions** — An assignment can go `bid_pending → bid_submitted → bid_won → bid_expired`. Each transition must correctly decrement one counter and increment another. This makes trigger logic complex and error-prone.
4. **Concurrency** — Multiple concurrent assignment updates for the same traveler can cause race conditions without `FOR UPDATE` locks.

**Better alternative: Server-side aggregation via RPC function.**

Instead of maintaining fragile counters, create a PostgreSQL function that computes stats server-side in a single query. This:
- Is always accurate (no drift)
- Requires zero trigger maintenance
- Moves the computation from client to database (much faster)
- Returns only the aggregated result (tiny payload vs. hundreds of raw rows)

### Solution: `get_traveler_stats_batch` RPC

**1. New PostgreSQL function** (migration)

A single RPC that accepts an array of user IDs and returns all stats in one call:

```sql
CREATE OR REPLACE FUNCTION get_traveler_stats_batch(p_user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  completed_trips bigint,
  delivered_packages bigint,
  assignments_responded bigint,
  assignments_no_response bigint,
  assignments_pending bigint,
  assignments_cancelled bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.uid AS user_id,
    -- Completed trips
    COALESCE((SELECT count(*) FROM trips t
      WHERE t.user_id = u.uid AND t.status = 'completed_paid'), 0),
    -- Delivered packages
    COALESCE((SELECT count(*) FROM packages p
      JOIN trips t ON p.matched_trip_id = t.id
      WHERE t.user_id = u.uid
      AND p.status IN ('completed','completed_paid','delivered_to_office')), 0),
    -- Assignment stats per traveler (across ALL their trips)
    COALESCE((SELECT count(*) FROM package_assignments pa
      JOIN trips t ON pa.trip_id = t.id
      WHERE t.user_id = u.uid
      AND (pa.status IN ('bid_submitted','bid_won','bid_lost')
        OR (pa.status = 'bid_expired' AND pa.quote IS NOT NULL))), 0),
    COALESCE((SELECT count(*) FROM package_assignments pa
      JOIN trips t ON pa.trip_id = t.id
      WHERE t.user_id = u.uid
      AND pa.status = 'bid_expired' AND pa.quote IS NULL), 0),
    COALESCE((SELECT count(*) FROM package_assignments pa
      JOIN trips t ON pa.trip_id = t.id
      WHERE t.user_id = u.uid
      AND pa.status = 'bid_pending'), 0),
    COALESCE((SELECT count(*) FROM package_assignments pa
      JOIN trips t ON pa.trip_id = t.id
      WHERE t.user_id = u.uid
      AND pa.status = 'bid_cancelled'), 0)
  FROM unnest(p_user_ids) AS u(uid);
$$;
```

This replaces **5 separate client-side queries** (assignments by trip, completed trips, all user trips, packages by trip, package status filter) with **1 RPC call** that returns pre-aggregated rows.

**2. Simplify `useTripAssignmentStats.ts`**

Replace the 3 `useQuery` calls + client-side counting with a single RPC call:

```typescript
const { data } = useQuery({
  queryKey: ["traveler-stats-batch", userIds],
  queryFn: async () => {
    const { data, error } = await supabase.rpc('get_traveler_stats_batch', {
      p_user_ids: userIds
    });
    if (error) throw error;
    return data;
  },
  enabled: userIds.length > 0,
  retry: 2,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
});
```

Then map the flat RPC result to the existing `TripStats` shape so `TripCard` needs zero changes.

**3. Database index** (migration)

Add a composite index to speed up the assignment aggregation:

```sql
CREATE INDEX IF NOT EXISTS idx_package_assignments_trip_status
  ON package_assignments (trip_id, status);
```

### Why This Is Better Than Counters

| Aspect | Counter columns | Server-side RPC |
|--------|----------------|-----------------|
| Accuracy | Can drift | Always correct |
| Maintenance | Complex triggers for every status transition | Zero |
| Backfill | Required one-time migration | Not needed |
| Race conditions | Possible | None |
| Query performance | O(1) read | O(n) but server-side, indexed, tiny payload |
| Code complexity | Triggers + hook changes | 1 function + simplified hook |

### Performance Impact

- **Before**: 3 separate queries, each returning raw rows to the client for counting. The `delivered_packages` query alone does 2 chained sub-queries.
- **After**: 1 RPC call returning ~N rows (one per unique traveler), each with 6 pre-computed integers. Total payload: < 1KB for 20 travelers.

### Files to Change

1. **New migration** — `get_traveler_stats_batch` function + index
2. **`src/hooks/useTripAssignmentStats.ts`** — Replace 3 queries with 1 RPC call, keep same exported interfaces

### Future Optimization Path

If the platform scales to thousands of travelers and the RPC still becomes slow, **then** add a `traveler_performance_cache` table with a trigger — but only when measured data justifies the complexity. Premature denormalization is a common source of bugs in growing systems.

