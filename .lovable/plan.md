

## Diagnosis: Why "Confirmar Match" Fails Silently

### Root Cause Found

The session replay reveals the "Confirmar Match" button was **enabled for ~134ms then immediately disabled again**. The dialog then closed because you clicked "Cancelar" (or X) since Confirmar was no longer clickable. No `[MATCH]` logs appeared because the match function never executed.

**Two interacting bugs cause this:**

#### Bug 1: Selection Reset from Stale Props
In `AdminMatchDialog.tsx` (line 434-440), there's a `useEffect` that resets `selectedTripIds` whenever `selectedPackage?.id` changes. The problem: `selectedPackage` is passed from `AdminDashboard`'s `localPackages` state. When any realtime update or snapshot sync refreshes `localPackages`, the `selectedPackage` object reference changes — even if the ID is the same — which can trigger React to re-run effects that depend on `selectedPackage`, causing cascading state resets.

#### Bug 2: Async Product Data Flips the Tip Mode
When the dialog opens, `heavyDetails` loads asynchronously (via `usePackageDetails`). If the initial `selectedPackage` has no `products_data` or 1 product, the dialog shows a simple tip input. But once `heavyDetails` loads and reveals multiple products, `isMultiProductOrder()` flips to `true`. Now `getTotalAssignedTip()` ignores the simple `adminTip` input and checks `assignedProductsWithTips` (which is empty) → returns 0 → button becomes disabled. The tip the user already entered is silently discarded.

### Fix Plan

#### 1. Stabilize the selection reset effect
Change the dependency from `selectedPackage?.id` to a ref-based comparison, so the effect only fires when the ID **actually changes**, not when the object reference updates.

```
// Before: resets on every selectedPackage reference change
useEffect(() => { ... reset ... }, [selectedPackage?.id]);

// After: only reset when ID truly changes
const prevPackageIdRef = useRef(selectedPackage?.id);
useEffect(() => {
  if (selectedPackage?.id !== prevPackageIdRef.current) {
    prevPackageIdRef.current = selectedPackage?.id;
    // ... reset selections ...
  }
}, [selectedPackage?.id]);
```

#### 2. Auto-migrate tip when product mode changes
When `isMultiProductOrder()` becomes true after loading, automatically initialize `assignedProductsWithTips` from the simple `adminTip` value (distributing it evenly), so the user doesn't lose their entered tip.

#### 3. Add defensive logging to the confirm button
Log exactly why the button is disabled at render time, so if it happens again we see the exact condition in the console:

```
// Log when button disabled state changes
if (selectedTripIds.size === 0) console.log('[MATCH-BTN] disabled: no trips selected');
if (getTotalAssignedTip() <= 0) console.log('[MATCH-BTN] disabled: tip is 0');
```

#### 4. Prevent realtime from mutating selectedPackage mid-dialog
In `AdminDashboard.tsx`, skip updating `selectedPackage` from external sources while the match dialog is open. The current `recentMatchRef` protection only activates **after** a match — it doesn't protect during the dialog interaction.

### Files to Modify
- `src/components/admin/AdminMatchDialog.tsx` — Fixes 1, 2, 3
- `src/components/AdminDashboard.tsx` — Fix 4

### Expected Result
- The "Confirmar Match" button stays enabled after selecting a trip and entering a tip
- No silent state resets from realtime updates while the dialog is open
- Console logs clearly show button state transitions for future debugging

