

## Fix WhatsApp Notifications for Multi-Assignment Flow

### Current State
The WhatsApp notifications are partially aligned but have some legacy paths that need cleanup:

1. **Traveler notification on assignment (bid_pending)**: Already working correctly in `useDashboardActions.tsx` lines 1368-1380 — sends `package_assigned` template to each traveler when admin creates assignments.

2. **Shopper notification on quote received**: Works in multiple places but some are legacy (single-assignment) paths that should be cleaned up or kept for backward compatibility.

### What Needs to Change

**Problem 1: Legacy traveler notification path (lines 700-750 in useDashboardActions.tsx)**
When a traveler accepts a tip in the old single-assignment flow (non-unified path), it still updates the package status to `quote_sent` and notifies the shopper. This legacy path should be reviewed — but it already sends the notification correctly.

**Problem 2: Traveler bid submission in unified flow (lines 424-475)**
When a traveler submits a bid via the assignment flow, the WhatsApp notification to the shopper is already sent correctly with `quote_received_v2`.

**Problem 3: Admin generates quotes in AdminActionsModal (lines 244-276)**
When admin sends quotes to travelers via the modal, it currently notifies the **shopper** (not the travelers). This is wrong — the admin is sending quotes TO travelers, so travelers should be notified.

### Changes

1. **`src/components/admin/AdminActionsModal.tsx`** — In the "Send quotes to travelers" block (around line 244):
   - Replace the shopper notification with notifications to each traveler using `package_assigned` template
   - Iterate over `pendingAssignments`, look up each traveler's `user_id` from the trips array, and send `package_assigned` to each

2. **`src/hooks/useDashboardActions.tsx`** — In `handleStatusUpdate` when admin changes to `quote_sent` (around line 1480):
   - Same fix: when generating quotes for assignments, notify each **traveler** (not the shopper)
   - The shopper notification at line 1593-1606 is for the legacy single-assignment path — keep it but ensure the assignment path notifies travelers instead

3. **`src/hooks/useDashboardActions.tsx`** — The traveler bid submission (line 462-475):
   - This already correctly notifies the shopper when a traveler submits their quote — no change needed

### Summary of notification flow after fix

| Event | Who gets notified | Template |
|-------|------------------|----------|
| Admin assigns travelers (bid_pending) | Each traveler | `package_assigned` |
| Admin sends quotes to travelers | Each traveler | `package_assigned` |
| Traveler submits bid (bid_submitted) | Shopper | `quote_received_v2` |
| Legacy: status → quote_sent | Shopper | `quote_received_v2` |

### Technical Details

- `AdminActionsModal.tsx`: Replace lines 244-276 (shopper notification) with a loop over `pendingAssignments` that looks up each traveler via `trips.find(t => t.id === assignment.trip_id)` and sends `package_assigned`
- `useDashboardActions.tsx` ~line 1480-1520: After updating assignments to `bid_submitted`, add traveler notifications similar to the matching flow
- No new templates needed — reuse `package_assigned` for traveler notifications and `quote_received_v2` for shopper notifications

