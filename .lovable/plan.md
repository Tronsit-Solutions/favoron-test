

## Problem: Duplicate `register_referral` function causing silent failures

There are **two versions** of the `register_referral` function in the database with different parameter order:

1. **Old (broken)**: `register_referral(p_referral_code text, p_referred_id uuid)` — tries `(value)::numeric` which **crashes** because `value` is JSONB `{"amount": 20}`, not a plain number.
2. **New (correct)**: `register_referral(p_referred_id uuid, p_referral_code text)` — correctly uses `value->>'amount'`.

When the client calls `supabase.rpc('register_referral', { p_referred_id, p_referral_code })`, PostgREST may resolve to the **old broken version**, which throws a cast error and silently fails (the `registerReferral` function in the frontend catches errors and just returns `{ success: false }`).

This explains why some referrals work and others don't — it depends on which overload PostgREST picks.

## Fix

### Step 1: Drop the old broken function
Run a migration to drop the old function signature `(p_referral_code text, p_referred_id uuid)`, leaving only the correct one `(p_referred_id uuid, p_referral_code text)`.

```sql
DROP FUNCTION IF EXISTS public.register_referral(text, uuid);
```

This removes the ambiguity and ensures the correct version (with `value->>'amount'`) is always called.

### Step 2: Add better error logging in frontend
Update `registerReferral` in `src/hooks/useReferrals.tsx` to log more details when it fails, so future issues are easier to debug.

No other code changes needed — the client call and the correct function signature already match.

