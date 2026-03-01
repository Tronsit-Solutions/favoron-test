

## Plan: Fix action buttons padding to match other sections

### Problem
The action buttons container (line 580) lost its `pl-5` left padding when fixing the expired quote margin. Now buttons like "Subir comprobante compra" extend without matching the indentation of other card sections (description, alerts, product status) which all use `pl-5`.

### Fix

**File**: `src/components/dashboard/CollapsiblePackageCard.tsx`, line 580

Restore `pl-5` to the action buttons container to match all other card content sections:

```tsx
// Line 580: Change from
<div className="space-y-2 w-full max-w-full">
// To
<div className="space-y-2 w-full max-w-full pl-5">
```

The expired quote banner (lines 586-597) already has its own internal padding (`p-3`) so adding `pl-5` back won't cause asymmetry there — it will just indent it consistently like the cancelled/office pickup banners.

