

## Fix: Add loading feedback and optimistic updates to Approvals tab

### Problem
When clicking "Aprobar" or "Rechazar", the card just disappears after a delay with no visual feedback. The flow is: click → `await updatePackage/updateTrip` → `await refreshPackages/refreshTrips` → toast. During those awaits, nothing visual happens.

### Solution

**1. Add loading state to `AdminApprovalsTab`**
- Track a `processingIds` Set state (`useState<Set<string>>`)
- When approve/reject is clicked, add the item ID to the set before calling `onApproveReject`
- While an item is in `processingIds`, show the card with reduced opacity + a spinner overlay, and disable the buttons
- Remove from set after the async call completes (in a `.finally()`)

**2. Wrap `onApproveReject` calls in the component**
- Create a local `handleApproveRejectWithLoading` that wraps the prop callback:
  ```
  const handleAction = async (type, id, action, reason?) => {
    setProcessingIds(prev => new Set(prev).add(id));
    try { await onApproveReject(type, id, action, reason); }
    finally { setProcessingIds(prev => { const n = new Set(prev); n.delete(id); return n; }); }
  };
  ```
- Replace all `onApproveReject` calls in the JSX with `handleAction`

**3. Visual treatment for processing cards**
- Add `opacity-50 pointer-events-none` + a small spinner overlay when the card's ID is in `processingIds`
- Buttons get `disabled={true}` during processing

**4. Speed improvement: parallel refresh elimination**
- In `useDashboardActions.tsx` `handleApproveReject`, the `refreshPackages`/`refreshTrips` call after the update is the main bottleneck. Since the UI already filters by `status === 'pending_approval'`, we can do an **optimistic removal**: don't await the refresh, just fire-and-forget it. The card disappears immediately via the loading state + local filter.
- Alternative: Add optimistic filtering in `AdminApprovalsTab` — maintain a local `dismissedIds` set that hides cards immediately, then the background refresh confirms it.

### Files to change
1. **`src/components/admin/AdminApprovalsTab.tsx`** — Add `processingIds` state, wrap approve/reject with loading handler, add visual loading indicator on cards
2. **`src/hooks/useDashboardActions.tsx`** — Make `refreshPackages`/`refreshTrips` non-blocking (don't await) in `handleApproveReject` to speed up the flow

