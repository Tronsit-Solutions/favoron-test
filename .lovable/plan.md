

## Revised Plan: Add Retry + Clean Dead Code

### Reassessment
The original plan over-engineered the fix. The RPC is already well-structured (75 lines, atomic transaction). The FOR LOOP handles 1-5 travelers — replacing it with INSERT...SELECT saves milliseconds, not seconds.

The real failure cause is likely **transient network errors** with no retry mechanism.

### Changes

**1. Add retry to the RPC call in `handleMatchPackage`**
Wrap the `supabase.rpc('assign_package_to_travelers', ...)` call with the existing `withRetry` utility from `src/lib/supabaseWithRetry.ts` (already in the project). One retry with a 2-second delay.

**2. Remove dead code in `useOptimisticUpdates.tsx`**
Delete `applyOptimisticMatch` — it's never called and references the legacy `matched_trip_id` pattern.

### Files
| File | Change |
|---|---|
| `src/hooks/useDashboardActions.tsx` | Wrap RPC call with `withRetry` |
| `src/hooks/useOptimisticUpdates.tsx` | Remove dead `applyOptimisticMatch` function |

### What we're NOT doing (and why)
- **Not rewriting the RPC** — it's already clean and atomic
- **Not replacing FOR LOOP with INSERT...SELECT** — negligible gain for 1-5 rows
- **Not restructuring `products_data` branches** — all 3 cases are valid

This is a surgical fix: retry for reliability, delete dead code for clarity.

