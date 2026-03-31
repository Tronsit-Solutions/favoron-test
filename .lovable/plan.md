

## Fix: Remove incorrect return detection by origin

### Problem
The `isReturnPackage` function in `AdminApprovalsTab.tsx` (line 193) marks any package with `purchase_origin === 'Guatemala'` as a return. This is wrong — a package originating from Guatemala is only a return if the user explicitly chose a return delivery method.

### Solution

**File: `src/components/admin/AdminApprovalsTab.tsx`**

Remove lines 193-195 from the `isReturnPackage` function, keeping only the `delivery_method` check:

```typescript
const isReturnPackage = (pkg: any): boolean => {
  return pkg.delivery_method === 'return_dropoff' || pkg.delivery_method === 'return_pickup';
};
```

One line change, no other files affected.

