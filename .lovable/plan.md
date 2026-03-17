

## Fix: Traveler card not updating after accepting tip

### Problem
After the traveler accepts a tip (unpaid package flow), the assignment status changes from `bid_pending` to `bid_submitted` in the database, but the UI still shows "Ver y Aceptar Tip" because:
1. The dialog closes (line 450) with **no data refresh** — no `refreshPackages()` or `refreshTrips()` call
2. The card reads `_assignmentStatus` to decide what to render, but the local state still has `bid_pending`

The rejection flow (line 497-499) correctly calls `refreshPackages()` + `refreshTrips()`, but the acceptance flow does not.

### Fix — `src/hooks/useDashboardActions.tsx`

After the toast on line 446 and before closing the dialog (line 450), add a data refresh:

```tsx
toast({
  title: "¡Tip aceptado!",
  description: "Se envió la cotización al shopper con la información de entrega.",
});

// Refresh data so the card reflects the new bid_submitted status
await refreshPackages();
await refreshTrips();

// Close dialog after acceptance handled
setShowQuoteDialog(false);
```

This mirrors the pattern already used in the rejection flow (lines 497-499).

### Files
1. `src/hooks/useDashboardActions.tsx` — add `refreshPackages()` + `refreshTrips()` after tip acceptance toast (around line 447)

