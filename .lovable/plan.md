

## Fix: Persist "No volver a mostrar" in DB instead of localStorage

### Problem
The "No volver a mostrar" checkbox saves to `localStorage`, so it resets on different browsers/devices and the modal keeps appearing. Also, the "Ahora no" button should say "Cerrar".

### Solution
Use the existing `profiles.ui_preferences` JSONB column to persist the dismiss flag. No migration needed.

### Changes

**1. `src/components/dashboard/ReferralAnnouncementModal.tsx`**
- `handleClose`: When `dontShowAgain` is checked, write `{ referral_announcement_dismissed: true }` into `profiles.ui_preferences` via Supabase (merge with existing preferences). Also keep localStorage as fallback.
- Change "Ahora no" text to **"Cerrar"**
- On slide 2, always show the checkbox + "Cerrar" button (current behavior kept, just text change)

**2. `src/components/Dashboard.tsx`**
- In the `useEffect` that checks whether to show the modal (~line 498-507):
  - Check `localStorage` first (fast, avoids flicker)
  - Also check `profiles.ui_preferences?.referral_announcement_dismissed` from the existing profile data
  - If either is `true`, skip showing the modal

### Technical Details
- The `ui_preferences` column is JSONB, so we merge with existing data: `ui_preferences: { ...existing, referral_announcement_dismissed: true }`
- The profile object is already available in Dashboard via `useAuth()`, so no extra query needed for the read check
- Write uses `supabase.from('profiles').update(...)` on close

