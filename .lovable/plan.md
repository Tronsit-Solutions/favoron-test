

## Fix: Traveler can re-submit quote and gets error

### Problem
Lucas Farias already sent his quote for "lulu shoes," but the package stays in `status: 'matched'` (correct per unified flow). Two bugs cause the error:

1. **QuoteDialog.tsx (line 486-488)**: When the traveler clicks "Aceptar Cotización," `submitData` only has `{ message: 'accepted', adminAssignedTipAccepted: true }` — **no `price` field**. In `useDashboardActions.tsx` line 322, the condition `quoteData.price !== undefined` is `false`, so it skips the traveler handler and falls through to the shopper's `accept_quote` RPC (line 720), which fails because `packages.status` is `'matched'`, not `'quote_sent'`.

2. **TravelerPackagePriorityActions.tsx (line 21)**: Only checks `pkg.status === 'matched'` to show the "Ver y Aceptar Tip" button. It doesn't check `pkg._assignmentStatus`. So even after the traveler's assignment row is already `quote_sent`, they still see the button and can attempt to re-submit.

### Fix 1: QuoteDialog.tsx (~line 487)
Add `price` to `submitData` when `isTravelerContext` so it enters the correct branch:

```typescript
if (isTravelerContext) {
  submitData.adminAssignedTipAccepted = true;
  submitData.price = displayAmount || adminTipAmount || 0;
}
```

### Fix 2: TravelerPackagePriorityActions.tsx (~line 21 and matched section ~line 130)
Check `_assignmentStatus` to hide the accept button if the traveler already sent their quote:

- In the `matched` status section, if `pkg._assignmentStatus === 'quote_sent'`, show a "Cotización enviada" disabled badge instead of the "Ver y Aceptar Tip" button
- This prevents the traveler from re-opening the dialog

### Files
- `src/components/QuoteDialog.tsx` — 1 line addition
- `src/components/dashboard/traveler/TravelerPackagePriorityActions.tsx` — update matched section to check `_assignmentStatus`

