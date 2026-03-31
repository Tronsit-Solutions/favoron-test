

## Fix: Auto-refresh package card after payment receipt upload

### Problem
After the shopper uploads a payment receipt, the package card doesn't reflect the new status (e.g., `payment_pending_approval`). The user must force-refresh the page. This happens because:

1. `PaymentReceiptUpload` already fetches the updated package from DB (with correct status from the trigger)
2. It calls `onUploadComplete(updatedPackage)` with the full fresh data
3. But in `CollapsiblePackageCard`, only `updatedPkg.payment_receipt` is passed to `onUploadDocument` — losing the updated status
4. `handleUploadDocument` does a redundant fetch with `select('*')` that lacks relation data (profiles, trips)
5. Uses stale `packages` closure in `setPackages(packages.map(...))`

### Solution

**File: `src/components/dashboard/CollapsiblePackageCard.tsx` (~line 1305-1312)**

Pass the **full** updated package object to `onUploadDocument` instead of just the `payment_receipt` field:

```typescript
onUploadComplete={updatedPkg => {
  if (onUploadDocument) {
    onUploadDocument(pkg.id, 'payment_receipt', updatedPkg);
  }
  setShowPaymentModal(false);
}}
```

**File: `src/hooks/useDashboardActions.tsx` (~line 1089-1102)**

In the `payment_receipt` branch, instead of doing a redundant DB fetch, use the full updated package passed as `data` and merge it preserving existing relation data:

```typescript
} else if (type === 'payment_receipt') {
  // data contains the full updated package from PaymentReceiptUpload
  // Merge preserving relation data (profiles, trips) from current state
  const currentPkg = packages.find(p => p.id === packageId);
  if (currentPkg) {
    const mergedPkg = {
      ...currentPkg,
      ...data,
      // Preserve relations that select('*') doesn't include
      profiles: currentPkg.profiles,
      trips: currentPkg.trips,
    };
    setPackages(packages.map(p => p.id === packageId ? mergedPkg : p));
  }
  return;
}
```

This eliminates the 600ms delay, the redundant DB query, and the stale closure issue — since the fresh data already comes from `PaymentReceiptUpload`'s own fetch.

### Files to edit
- `src/components/dashboard/CollapsiblePackageCard.tsx` — pass full package to callback
- `src/hooks/useDashboardActions.tsx` — merge instead of re-fetch

