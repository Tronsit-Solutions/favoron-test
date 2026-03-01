

## Plan: Fix referral announcement dismissal key mismatch

### Root Cause
- **Dashboard.tsx** (line 374) reads: `localStorage.getItem(\`referral_announcement_dismissed_${currentUser.id}\`)`  
  where `currentUser.id` = `user.id` (Supabase auth UUID)
- **ReferralAnnouncementModal.tsx** (line 63) writes: `localStorage.setItem(\`referral_announcement_dismissed_${(profile as any).id}\`, 'true')`  
  where `profile.id` could be a different value (profile table primary key)

The keys don't match, so the dismissal is never detected.

### Fix
**File**: `src/components/dashboard/ReferralAnnouncementModal.tsx`, line 61-64

Change `(profile as any)?.id` to use the auth user ID instead. The `useAuth` hook returns `user` which has the correct `.id`. Update the modal to use `user.id` for the localStorage key:

```tsx
const { profile, user } = useAuth();

// In handleClose:
if (dontShowAgain && user?.id) {
  localStorage.setItem(`referral_announcement_dismissed_${user.id}`, 'true');
}
```

This ensures the same key is used for both reading and writing.

