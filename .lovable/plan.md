

## Fix: Google OAuth Simulator Button

### Problem
The simulator button navigates to `/complete-profile`, but the admin's profile is already complete (has phone, name, etc.). So the `CompleteProfile` page immediately redirects back to `/dashboard` via the `useEffect` on line 41-44, causing the flash.

### Solution
Add a `?simulate=true` query parameter when the admin clicks the button. The `CompleteProfile` page will check for this param and skip the "already complete → redirect" logic, allowing the admin to see and interact with the page.

### Changes

**1. `src/components/dashboard/DashboardHeader.tsx`**
- Change the navigation from `/complete-profile` to `/complete-profile?simulate=true`

**2. `src/pages/CompleteProfile.tsx`**
- Read `simulate` from `useSearchParams`
- When `simulate=true`, skip the redirect-if-complete `useEffect`
- Clear pre-filled fields (phone, document) so the admin sees the "incomplete" experience
- On save in simulate mode, just redirect to `/dashboard` without actually updating the profile (or update normally — either way)

**3. `src/components/auth/RequireAuth.tsx`**
- Allow `/complete-profile?simulate=true` through even if profile is complete (the current check on line 52 already allows it since `isProfileComplete` returns true and the condition requires `!isProfileComplete`, so the redirect won't trigger — but the page itself redirects). No change needed here.

