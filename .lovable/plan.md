

## Problem

The `purchase_confirmation` field is now saved as an **array** (from the multi-upload feature), but two places in `PackageDetailModal.tsx` still treat it as a single object:

1. **Line 811** — `hasPurchaseConfirmation` checks `pkg.purchase_confirmation.filePath` / `.filename`, which are `undefined` on an array → evaluates to `false` → section is hidden
2. **Lines 2263-2269** — `PurchaseConfirmationViewer` receives the raw array but expects a single object

Additionally, `PurchaseConfirmationViewer` itself only renders **one** document. It needs to handle an array.

## Fix

### 1. `src/components/admin/PackageDetailModal.tsx`

- Import `normalizeConfirmations` from `@/utils/confirmationHelpers`
- Change `hasPurchaseConfirmation` (line 811) to:
  ```ts
  const confirmations = normalizeConfirmations(pkg.purchase_confirmation);
  const hasPurchaseConfirmation = confirmations.length > 0;
  ```
- Replace the single `<PurchaseConfirmationViewer>` call with a loop over `confirmations`, rendering one viewer per document

### 2. `src/components/admin/PurchaseConfirmationViewer.tsx`

- No structural changes needed — it already handles a single confirmation object correctly. We just loop from the parent.

### 3. Other consumers to fix with same pattern

- `src/components/dashboard/TravelerPackageCard.tsx` (line 142)
- `src/components/dashboard/traveler/TravelerPackageDetails.tsx` (line 323)

Both pass `pkg.purchase_confirmation` directly — need to normalize and loop.

