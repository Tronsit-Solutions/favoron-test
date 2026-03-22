

## Fix: Tip assignment getting stuck on "Guardando..."

### Probable causes

1. **`saveProductTips` strips product fields** — The `normalizedProducts` mapping in `useAdminTips.tsx` only preserves 6 fields (`itemDescription`, `estimatedPrice`, `itemLink`, `quantity`, `adminAssignedTip`, `additionalNotes`). When written back to `packages.products_data`, it **overwrites** critical fields like `requestType`, `productPhotos`, `instructions`, `weight`, `declaredValue`, `cancelled`, `refundAmount`, etc. This data loss could trigger downstream issues or slow validation.

2. **DB trigger conflict** — The `apply_quote_pricing` trigger runs on every `quote` UPDATE with a hardcoded `1.4x` multiplier, overwriting the carefully calculated `serviceFee` and `totalPrice` from the dynamic platform rates. This creates incorrect pricing and potential issues with subsequent operations.

3. **No timeout or error boundary** — If the Supabase call hangs (network issue, slow trigger), the button stays on "Guardando..." forever with no timeout.

### Solution

**1. Preserve all existing product fields in `useAdminTips.tsx`**

Instead of mapping to only 6 fields, spread the full existing product data and only update `adminAssignedTip`:

```ts
// Fetch current products_data to preserve all fields
const currentProducts = currentPkg.products_data || [];

const normalizedProducts = products.map((p, idx) => ({
  ...(currentProducts[idx] || {}),  // preserve ALL existing fields
  ...p,                              // overlay new tip values
  adminAssignedTip: Number.isFinite(p.adminAssignedTip) ? p.adminAssignedTip : 0,
}));
```

This requires also fetching `products_data` in the SELECT query (line 52).

**2. Mark quote as `manually_edited` to skip trigger**

Update the `apply_quote_pricing` trigger to skip when `quote->>'manually_edited'` is true, so admin-set prices aren't overwritten:

```sql
IF (NEW.quote->>'manually_edited')::boolean IS TRUE THEN
  RETURN NEW;
END IF;
```

**3. Add timeout protection in `ProductTipAssignmentModal.tsx`**

Wrap the save call with a timeout so the button doesn't stay stuck forever:

```ts
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Timeout')), 15000)
);
await Promise.race([saveProductTips(...), timeoutPromise]);
```

### Files to modify
- `src/hooks/useAdminTips.tsx` — preserve existing product fields, fetch `products_data` in SELECT
- `src/components/admin/ProductTipAssignmentModal.tsx` — add timeout protection
- New migration — update `apply_quote_pricing` trigger to respect `manually_edited` flag

