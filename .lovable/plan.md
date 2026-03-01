

## Plan: Add Referral Report to Admin Control

### Overview
Create a new admin page `/admin/referrals` with a comprehensive referral report table showing who referred whom, registration dates, referral status, and reward details. Add a navigation card in AdminControl to access it.

### Current Data
The `referrals` table has: `referrer_id`, `referred_id`, `status` (pending/completed), `reward_amount`, `referred_reward_amount`, `referred_reward_used`, `created_at`, `completed_at`. Profiles have `referral_code`. Admins already have SELECT access to both tables.

### Implementation

**1. New page: `src/pages/AdminReferrals.tsx`**
- Protected with `RequireAdmin`
- Back button to `/admin/control`
- Summary KPI cards at top: total referrals, pending, completed, total rewards distributed
- Full table with columns:
  - Referidor (name + email + referral code)
  - Referido (name + email)
  - Estado (pending/completed badge)
  - Reward referidor (Q amount)
  - Descuento referido (Q amount, used/unused)
  - Fecha registro (created_at)
  - Fecha completado (completed_at)
- Query joins `referrals` with `profiles` for both referrer and referred user info

**2. Hook: `src/hooks/useAdminReferrals.tsx`**
- Fetches all referrals with referrer/referred profile data using two queries (referrals + profiles lookup)
- Since we can't do JOINs via Supabase client, fetch referrals then batch-fetch profiles for all unique user IDs

**3. Update `src/pages/AdminControl.tsx`**
- Add navigation card for "Reporte de Referidos" linking to `/admin/referrals`

**4. Update `src/App.tsx`**
- Add route `/admin/referrals` → `AdminReferrals`

### Files to create/modify
- **Create**: `src/pages/AdminReferrals.tsx`, `src/hooks/useAdminReferrals.tsx`
- **Modify**: `src/pages/AdminControl.tsx` (add nav card), `src/App.tsx` (add route)

