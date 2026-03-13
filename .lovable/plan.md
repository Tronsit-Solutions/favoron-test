

## Bug: Multi-product packages show orange clock even when confirmed

### Problem
In the payment breakdown modal, there are two code paths for showing confirmation icons:

1. **Single-product packages** (line 876): Correctly checks `pkg.status` and `pkg.office_delivery.admin_confirmation` — shows green check.
2. **Multi-product packages** (line 832): Only checks `product.receivedAtOffice` on each product in `products_data` — this field is never set during the office confirmation flow, so it always shows the orange clock.

### Fix
**File:** `src/components/admin/AdminTravelerPaymentsTab.tsx` (~line 832)

For multi-product packages, add a fallback: if `product.receivedAtOffice` is not set, check the package-level confirmation status (same logic used for single-product packages). This way, if the package itself is confirmed (`delivered_to_office` with `admin_confirmation`, or in a post-office status like `completed`, `ready_for_pickup`, etc.), all its active products will show the green check.

```
// Before checking product.receivedAtOffice, determine package-level confirmation
const officeDelivery = pkg.office_delivery as any;
const postOfficeStatuses = ['completed', 'ready_for_pickup', 'ready_for_delivery', 'out_for_delivery'];
const packageConfirmed = postOfficeStatuses.includes(pkg.status || '') || 
  (pkg.status === 'delivered_to_office' && officeDelivery?.admin_confirmation);

// Then for each product:
// Use product.receivedAtOffice || packageConfirmed
```

This is a UI-only fix — no database or edge function changes needed.

