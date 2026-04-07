

## Why matches take minutes (or never complete)

### Root Cause: 21 triggers fire inside one transaction

When the RPC `assign_package_to_travelers` runs `UPDATE packages SET status = 'matched'`, **21 triggers** execute inside the same database transaction. Even though most are no-ops for this specific transition and `create_notification_with_direct_email` uses async `pg_net`, the sheer number of trigger evaluations adds overhead. But this alone shouldn't cause minutes of delay.

**The real problem is simpler**: the match attempt for `fb569aa9` **never reached the database at all**. The package is still `approved`, no new `package_assignments` rows exist, and no error was logged to `client_errors`. This means the RPC call timed out at the browser/network level before Postgres even processed it.

The likely chain:
1. Browser `fetch()` has a default timeout (~60s on most browsers, but Safari can be as low as 30s)
2. PostgREST/Supabase has a default statement timeout (~8s for the free tier, configurable on paid tiers)
3. If the RPC call hits a slow query plan or lock contention, it exceeds the timeout
4. The `fetch` promise rejects with "Failed to fetch" or similar
5. The retry mechanism kicks in (2s delay, then 4s delay) adding ~6s of dead time
6. All 3 attempts time out → total ~30-60s of waiting
7. But the error handling in `handleMatchPackage` only catches Supabase errors with `.error` — a **network timeout throws a raw Error** that might not be caught properly

### What I confirmed
- `create_notification_with_direct_email` → uses `net.http_post` (async, non-blocking) — not the bottleneck
- All notification triggers call this via `PERFORM` — lightweight, returns quickly
- The `package_assignments` INSERT triggers are minimal (just set `expires_at`)
- No synchronous HTTP calls (`extensions.http`) found

### Proposed fix: Add timing instrumentation + increase RPC timeout

**1. Add timing logs to `handleMatchPackage`** (`src/hooks/useDashboardActions.tsx`)
- Wrap the RPC call with `performance.now()` markers to measure exact duration
- Log timing to console AND to `client_errors` on failure
- This will tell us definitively whether it's a 8s PostgREST timeout, a 30s browser timeout, or something else

**2. Set an explicit fetch timeout on the RPC call**
- Use `AbortController` with a 25s timeout so the call fails fast instead of hanging for minutes
- This prevents the "minutes of waiting" — worst case is 25s + retry delays

**3. Reduce retry delays**
- Change from exponential backoff (2s, 4s) to fixed 1s intervals
- Total worst-case wait drops from ~60s+ to ~30s

### Files to change
1. `src/hooks/useDashboardActions.tsx` — Add timing, AbortController timeout, reduce retry delays

### Technical detail

```typescript
// In handleMatchPackage, wrap the RPC call:
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 25000);

const startTime = performance.now();
const { data, error } = await supabase.rpc('assign_package_to_travelers', {
  _package_id: packageId,
  _trip_ids: tripIdsToAssign,
  _admin_tip: adminTip,
  _products_data: updatedProductsData || null
}, { signal: controller.signal });
clearTimeout(timeout);

const elapsed = Math.round(performance.now() - startTime);
console.log(`[MATCH] RPC completed in ${elapsed}ms`);
```

And reduce retry delays:
```typescript
// Change from: await new Promise(r => setTimeout(r, 2000 * attempt));
// To: await new Promise(r => setTimeout(r, 1000));
```

This won't fix the underlying timeout issue (which may be a Supabase tier limit), but it will:
- Give us exact timing data on the next attempt
- Cap the maximum wait to ~28s instead of minutes
- Provide actionable diagnostic data to determine if we need to optimize the trigger chain

