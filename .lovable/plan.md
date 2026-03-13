

## Add notification badges to Admin Control cards

### What
Show red notification badges on the "Programa de Referidos" and "Aplicaciones" cards in AdminControl.tsx when there are pending items.

### How

**File: `src/pages/AdminControl.tsx`**

1. Add two queries on mount:
   - `supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('status', 'pending')` → pending referrals count
   - `supabase.from('job_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending')` → pending applications count

2. Store counts in state (`pendingReferrals`, `pendingApplications`).

3. Import `NotificationBadge` from `@/components/ui/notification-badge`.

4. On the "Programa de Referidos" card title, add `<NotificationBadge count={pendingReferrals} />` next to the icon/text.

5. On the "Aplicaciones" card title, add `<NotificationBadge count={pendingApplications} />` next to the icon/text.

### Visual result
The red badge (already styled in `notification-badge.tsx`) appears in the card header next to the title text, showing the count of pending items. Badge disappears when count is 0.

