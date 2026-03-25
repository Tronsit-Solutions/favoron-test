

## Fix: Tip Modal Shows Wrong Package Products

### Root Cause
Two bugs cause the tip modal to display products from a **previously selected** package instead of the current one:

**Bug 1: Stale `heavyDetails` in `usePackageDetails`**
When `packageId` changes, the hook starts fetching new data but **keeps the old `details` in state** until the fetch completes. The merge logic in `AdminMatchDialog.tsx` (line 80) uses `heavyDetails?.products_data || selectedPackage.products_data`, so during the fetch gap, stale products from the previous package are passed to the tip modal.

**Bug 2: `ProductTipAssignmentModal` initialization guard**
Line 52: `if (initialProducts.length === 0 || products.length > 0) return;` — the `products.length > 0` check prevents re-initialization if the component isn't fully remounted. Although the `key` prop should force a remount, stale data from Bug 1 means the modal initializes with the wrong products even on a fresh mount.

### Plan

**1. Reset details on packageId change in `usePackageDetails.tsx`**
- At the start of `fetchDetails()`, immediately `setDetails(null)` before the async fetch begins
- This ensures the merge in `AdminMatchDialog` falls back to `selectedPackage.products_data` (the correct lightweight data) instead of stale heavy details

**2. Strengthen initialization in `ProductTipAssignmentModal.tsx`**  
- Change the useEffect dependency from `[initialProducts.length]` to `[packageId]` so products re-initialize when the package actually changes, not just when the count changes
- Reset `products` state to `[]` at the start of the effect to avoid the `products.length > 0` guard blocking re-initialization

### Files to modify
| File | Change |
|---|---|
| `src/hooks/usePackageDetails.tsx` | Add `setDetails(null)` at start of fetch when packageId changes |
| `src/components/admin/ProductTipAssignmentModal.tsx` | Fix useEffect deps to use `packageId`, reset products on change |

