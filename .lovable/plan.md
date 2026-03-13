

## Analysis

**What happened with Larias Fucas**: Registered at 11:06 UTC. The `register_referral` function at that time still had the broken `(value)::numeric` cast (the fix migration was applied at 11:09). So the RPC crashed silently, no referral was created, and the frontend deleted the pending code from localStorage — no retry possible.

The DB function is now fixed and live. The problem is purely **frontend resilience**: if the RPC fails, the referral code is lost forever.

**Larias's `referrer_name` = "luxi"** came from the acquisition survey (`submit_acquisition_survey`), not from the referral system. No referral record exists.

## Plan: Blindar el flujo de referidos

### 1. Don't delete referral code on failure (`src/pages/Auth.tsx`)
Currently lines 308-314: the code calls `registerReferral`, ignores the result, and always removes the localStorage keys. Change to:
- Only remove `pending_referral_code` if `registerReferral` returns `{ success: true }`
- If it fails, keep the code in localStorage for retry on next login

### 2. Retry on login and dashboard load
- **Auth.tsx `handleSignIn`**: After successful login, check for `pending_referral_code` in localStorage and attempt `registerReferral` again
- **Dashboard or useAuth hook**: On app load with authenticated user, check for `pending_referral_code` and retry. This catches cases where user closes browser after failed signup referral and comes back later

### 3. Add retry with delay in signup flow (`src/pages/Auth.tsx`)
After signup, wait 1-2 seconds before calling `registerReferral` (in case of any async profile creation timing). If it fails, retry once more after 3 seconds. Only clear localStorage on success.

### 4. Better error feedback in `registerReferral` (`src/hooks/useReferrals.tsx`)
Return more detail: `{ success, error, shouldRetry }` so callers can decide whether to keep the code for later.

### Files to modify
- `src/pages/Auth.tsx` — signup handler (retry logic), signin handler (retry on login)
- `src/hooks/useReferrals.tsx` — enhanced return type for `registerReferral`
- Create a small utility `src/lib/referralRetry.ts` with the retry-with-delay logic, shared between signup and login flows

