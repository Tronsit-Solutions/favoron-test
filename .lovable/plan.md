

## Root Cause: Dialog blocks its own closure

The RPC and insert-only architecture are **correct** — no UNIQUE constraint, terminal statuses pass the filter. The actual failure is a **deadlock between two state machines**:

### The Bug Chain

```text
1. User clicks "Confirmar Match"
2. AdminMatchDialog.handleMatch():
   → sets isSubmittingMatch = true
   → calls onMatch() (fire-and-forget, no await)

3. onMatch → AdminDashboard.handleMatch():
   → calls setShowMatchDialog(false)    ← tries to close dialog
   → Radix Dialog triggers onOpenChange(false)
   → handleCloseDialog(false) runs
   → sees isSubmittingMatch === true    ← BLOCKS THE CLOSE
   → returns early, dialog stays open

4. Dialog is now PERMANENTLY stuck:
   - isSubmittingMatch = true (never reset)
   - Button shows "Confirmando..." forever
   - Escape, outside click, Cancel all blocked
   - No way to close the dialog
```

The RPC actually runs and **succeeds** in the background (AdminDashboard shows the success toast behind the stuck dialog), but the user never sees it because the dialog covers everything.

### Your point about insert vs update

You're 100% correct. The insert-only approach is already implemented and working. Each re-assignment creates a new `package_assignments` row, preserving the full history (tip offered, whether traveler responded, rejection reason, etc.). No changes needed to the RPC logic.

### Fix

**File: `src/components/admin/AdminMatchDialog.tsx`** — 2 changes:

1. **Make `handleMatch` async and add try/finally** to always reset `isSubmittingMatch`:

```typescript
const handleMatch = async () => {
  if (selectedTripIds.size === 0 || isSubmittingMatch) return;
  setIsSubmittingMatch(true);
  try {
    const tipAmount = getTotalAssignedTip();
    const tripIdsArray = Array.from(selectedTripIds);
    if (isMultiProductOrder()) {
      await onMatch(tipAmount, assignedProductsWithTips, tripIdsArray);
    } else {
      await onMatch(tipAmount, undefined, tripIdsArray);
    }
  } catch (error) {
    console.error('[MATCH-DIALOG] Match failed:', error);
  } finally {
    setIsSubmittingMatch(false);
  }
};
```

2. **Add safety reset** when dialog opens:

```typescript
useEffect(() => {
  if (showMatchDialog) {
    setIsSubmittingMatch(false);
  }
}, [showMatchDialog]);
```

3. **Allow programmatic close** in `handleCloseDialog` — only block user-initiated closes during submission, not parent-driven closes. Since `AdminDashboard.handleMatch` calls `setShowMatchDialog(false)` directly (which controls the `open` prop), and Radix Dialog's controlled mode will close regardless of `onOpenChange`, this is actually already handled. But adding the `finally` ensures the guard resets even if the dialog stays mounted.

### Summary

- The RPC works. The insert-only architecture is correct.
- The dialog gets stuck because `isSubmittingMatch` blocks its own closure and is never reset.
- Fix is purely in `AdminMatchDialog.tsx` — add `async/await/try/finally` + reset on open.

