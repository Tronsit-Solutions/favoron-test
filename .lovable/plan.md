

## Fix: Inactive packages missing dismiss button and showing wrong status

### Problems identified

1. **Dismiss button only appears for `quote_expired` packages** — The mobile dismiss button (line 375) checks `isQuoteExpired(pkg)`, and the desktop dismiss buttons (lines 439-461) only render inside `pkg.status === 'matched'`. Packages with terminal assignment statuses (`bid_lost`, `bid_expired`, `bid_cancelled`) that have a non-matched package status (e.g., `approved`, `pending_purchase`) never show a dismiss button.

2. **Status badge shows package status, not assignment status** — The `TravelerPackageStatusBadge` on line 602 always renders `pkg.status` (e.g., "Aprobado", "Pago confirmado"). For inactive assignments, the traveler should see the assignment-level status ("Otro viajero fue seleccionado", "Asignación expirada", etc.), not the package's lifecycle status which belongs to the winning traveler.

### Solution

**File: `src/components/dashboard/CollapsibleTravelerPackageCard.tsx`**

1. **Add a helper** at the top of the component to detect terminal assignment status:
```ts
const isTerminalAssignment = ['bid_lost', 'bid_expired', 'bid_cancelled'].includes(pkg._assignmentStatus);
```

2. **Override status badge for terminal assignments** — On the desktop badge (line 602), when `isTerminalAssignment` is true, show an assignment-specific badge instead of `TravelerPackageStatusBadge`:
   - `bid_lost` → "❌ No seleccionado" (red)
   - `bid_expired` → "⏰ Expirada" (amber)
   - `bid_cancelled` → "Cancelada" (gray)

3. **Mobile status button override** — On the mobile status button (lines 355-372), when `isTerminalAssignment`, show the assignment status label instead of the package status.

4. **Add dismiss button for all terminal assignments** — Expand the mobile dismiss condition (line 375) from `isQuoteExpired(pkg)` to also include `isTerminalAssignment`:
```tsx
{(isQuoteExpired(pkg) || isTerminalAssignment) && pkg._assignmentId && (
  <Button ...onClick={() => setShowDismissConfirm(true)}>
    Descartar de mis viajes
  </Button>
)}
```

5. **Desktop status messages** — Add a block before the `pkg.status === 'matched'` check (line 434) that renders the terminal assignment message with dismiss button for ANY package status when `isTerminalAssignment` is true, preventing the confusing package-level status messages from showing.

**File: `src/components/dashboard/traveler/TravelerPackageStatusBadge.tsx`**

No changes needed — the override happens at the card level.

### Summary of changes
- 1 file modified: `CollapsibleTravelerPackageCard.tsx`
- Terminal assignments show assignment-specific status instead of package status
- Dismiss button appears for all terminal assignment states (mobile + desktop)
- Uses existing `handleDismissAssignment` + `AlertDialog` confirmation flow

