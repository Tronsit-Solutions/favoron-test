

## Two Features: Full-Page Profile Completion + Google OAuth Simulator Button

### 1. Full-Page Profile Completion for Incomplete Profiles

**New page: `src/pages/CompleteProfile.tsx`**
- Full-page branded layout with Favoron logo, welcome message, progress indicator
- Reuses `PersonalInfoForm` component (same as ProfileCompletionModal)
- Shows only missing fields (pre-fills what Google already provided: name, email, avatar)
- Required: phone_number (with WhatsApp validation), first_name, last_name
- No skip/cancel — must complete to proceed
- On save → redirect to `/dashboard`
- Uses `useAuth` for profile data and `updateProfile` to save

**Update `src/components/auth/RequireAuth.tsx`**
- After user exists and role is loaded, check `isProfileComplete(profile)` from `useProfileCompletion`
- If incomplete AND current path is NOT `/complete-profile` → `<Navigate to="/complete-profile" />`
- Needs `profile` from `useAuth` context (already available via the hook)

**Update `src/App.tsx`**
- Add `/complete-profile` route wrapped in a minimal auth check (not full `RequireAuth` to avoid circular redirect)
- Could use a separate `RequireAuthOnly` wrapper or add an `allowIncompleteProfile` prop to `RequireAuth`

**Cleanup `src/components/Dashboard.tsx`**
- Remove the auto-show `useEffect` for `ProfileCompletionModal` (lines 216-224) since the full page replaces it
- Keep the modal component for action-level blocking as secondary safety net

### 2. Google OAuth Simulator Button (Admin Only)

**Update `src/components/dashboard/DashboardHeader.tsx`**
- Add a new button (admin only, next to WhatsApp/Operations buttons) with a Google-style icon or `UserPlus` icon
- Styled distinctly (e.g., purple/pink background) to indicate it's a dev/test tool
- On click: creates a test user via Supabase with only name/email filled (no phone), simulating a Google OAuth signup with incomplete profile
- Or simpler: navigates to `/complete-profile` directly so admin can see/test the flow
- Hidden on mobile, shown in dropdown for mobile (same pattern as other admin buttons)

### Flow after changes

```text
Google OAuth → /dashboard → RequireAuth checks profile
  → incomplete? → redirect /complete-profile
  → user fills phone + other fields → save → redirect /dashboard
  → complete? → show dashboard normally
```

### Technical Details
- Add `allowIncompleteProfile` prop to `RequireAuth` to prevent circular redirect on `/complete-profile`
- `isProfileComplete` function already exists in `useProfileCompletion.tsx` — checks `phone_number`, `first_name`, `last_name`
- The simulator button can simply null out the current user's `phone_number` temporarily (with a confirmation dialog) to trigger the flow, or navigate directly to `/complete-profile`

### Files
- **Create**: `src/pages/CompleteProfile.tsx`
- **Modify**: `src/components/auth/RequireAuth.tsx` (profile completeness redirect)
- **Modify**: `src/App.tsx` (add route)
- **Modify**: `src/components/dashboard/DashboardHeader.tsx` (simulator button)
- **Modify**: `src/components/Dashboard.tsx` (remove auto-modal logic)

