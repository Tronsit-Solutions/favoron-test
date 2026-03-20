

## Fix: Persist Boost Code on Trips Table

### Problem
Boost codes entered during trip registration are lost because `validate_boost_code` fails — no `trip_payment_accumulator` row exists yet at trip creation time. Percentage boosts also require accumulated tips which don't exist for new trips.

### Solution
Add a `boost_code` column to the `trips` table to store the code at creation time. Apply the boost later when the accumulator is created/recalculated.

### Changes

**1. Database Migration**
- Add `boost_code text` column to `trips` table (nullable, default null)

**2. `src/hooks/useDashboardActions.tsx`**
- Instead of calling `validate_boost_code` RPC after trip creation, include `boost_code` in the trip insert payload so it's persisted on the trip row
- Remove the post-creation RPC call; show a success message that the boost code was saved

**3. `src/hooks/useOptimizedTripsData.tsx`**
- Add `boost_code` to the select fields

**4. `src/hooks/useTripsData.tsx`**
- Add `boost_code` to the select fields

**5. `src/hooks/useCreateTripPaymentAccumulator.tsx`**
- When creating/updating the accumulator, check if the trip has a `boost_code` set
- If so, call `validate_boost_code` RPC at that point (when the accumulator exists)
- This handles both fixed and percentage boosts correctly since tips are already accumulated

**6. Admin visibility**
- The `boost_code` column on trips makes it easy to query which trips have a boost pending or applied, complementing the existing `boost_code_usage` table

### Technical Detail
- `boost_code_usage` table continues to be the source of truth for whether a boost was **applied**
- `trips.boost_code` stores the **intent** — the code the traveler entered
- The accumulator logic bridges the gap: when it runs, it checks if `trips.boost_code` is set but no `boost_code_usage` exists for that trip, and applies it then

