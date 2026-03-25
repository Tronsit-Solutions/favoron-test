

## Fix: Shopper receipt upload not updating status without hard refresh

### Problem
When a shopper uploads a payment receipt, the package status doesn't update in the UI until they do a hard refresh.

**Root cause**: Double-update race condition.
1. `PaymentReceiptUpload.confirmUpload()` saves the receipt to DB and the trigger updates the status correctly.
2. Then `handleUploadDocument` in `useDashboardActions` calls `updatePackage()` again with the same `payment_receipt` data — this registers a "recent mutation" that causes the realtime subscription to **skip** the status change event (2-second suppression window).
3. The second `updatePackage` returns data from before the trigger has run on that update, so local state keeps the old status.

### Solution
In `handleUploadDocument` (`src/hooks/useDashboardActions.tsx`), for `payment_receipt` type, instead of calling `updatePackage()` (which re-writes the same data), directly re-fetch the package from Supabase to get the trigger-updated status and merge it into local state.

### File to modify
**`src/hooks/useDashboardActions.tsx`** (lines ~1088-1101)
- For `payment_receipt` type: skip `updatePackage()`, instead fetch the fresh package from DB with a small delay (to let the trigger complete), then update local package state with the correct status.

### Technical detail
```
// Instead of:
updatedData.payment_receipt = data;
await updatePackage(packageId, updatedData);

// Do:
if (type === 'payment_receipt') {
  // Package already updated by PaymentReceiptUpload - just refresh local state
  await new Promise(r => setTimeout(r, 600));
  const { data: freshPkg } = await supabase
    .from('packages').select('*').eq('id', packageId).single();
  if (freshPkg) {
    setPackages(prev => prev.map(p => p.id === packageId ? { ...p, ...freshPkg } : p));
  }
  return;
}
```

