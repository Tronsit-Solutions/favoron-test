

## Fix: Traveler rejection flow for package_assignments

### Problem
The "Rechazar" button for travelers fails because the rejection path calls the old RPC `traveler_reject_assignment`, which does `JOIN trips t ON t.id = p.matched_trip_id WHERE p.status = 'matched'`. With the new `package_assignments` architecture, `matched_trip_id` on the package row may be NULL (data lives in the assignment row), so the RPC returns "No tienes permisos".

### Solution
Update the rejection handler in `useDashboardActions.tsx` to detect assignment-based matches (`_assignmentId`) and handle them directly via `package_assignments` update instead of the old RPC. Fall back to the old RPC only for legacy matches without an assignment.

### Changes

**File: `src/hooks/useDashboardActions.tsx` (~lines 475-522)**

Replace the `isTravelerRejectingAssignedTip` block with:

1. Check if `selectedPackage._assignmentId` exists (new assignment-based flow)
2. If yes:
   - Update the `package_assignments` row to `status: 'bid_cancelled'` with rejection metadata (reason, comments, timestamp)
   - Check if there are any other active assignments for this package (`bid_pending` or `bid_submitted`). If none remain, reset the package status back to `approved` and clear `admin_assigned_tip`
   - Show success toast, refresh data
3. If no `_assignmentId` (legacy): keep the existing RPC call as fallback

**New RPC (migration):** Create `traveler_reject_assignment_v2` that accepts `_assignment_id UUID` instead of `_package_id`, and:
- Verifies the assignment belongs to the caller's trip
- Updates assignment status to `bid_cancelled` with rejection metadata
- Checks remaining active assignments; if none, resets package to `approved`
- Preserves audit trail in `admin_actions_log`

Using a SECURITY DEFINER RPC is safer than direct client-side updates to avoid RLS issues.

### Detailed steps

1. **New migration**: Create `traveler_reject_assignment_v2(_assignment_id UUID, _rejection_reason TEXT, _additional_comments TEXT)` RPC
   - Verify `auth.uid()` owns the trip linked to the assignment
   - Verify assignment status is `bid_pending`
   - Update assignment to `bid_cancelled` with rejection JSONB
   - Count remaining active assignments for the package
   - If zero active: reset package to `approved`, clear `admin_assigned_tip`, `matched_trip_id`
   - Append to package `admin_actions_log`

2. **`src/hooks/useDashboardActions.tsx`** (rejection block ~line 475-522):
   - If `_assignmentId` exists, call new RPC `traveler_reject_assignment_v2` with `_assignment_id`
   - Else, fall back to existing `traveler_reject_assignment` RPC
   - Both paths: show toast, refresh data, close dialog

3. **No changes needed** to `QuoteDialog.tsx` or `TravelerRejectionModal.tsx` — they already pass rejection data correctly to `onSubmit`.

