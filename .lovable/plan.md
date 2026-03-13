

## Bug: Delivery fee always defaults to Q60 for non-Guatemala City areas

### Root Cause Found

After extensive investigation, the systemic pattern is clear from the database:
- **Villa Canales** → Q60 (should be Q45)
- **Santa Catarina Pinula** → Q60 (should be Q45)
- **Mixco** → Q60 (should be Q45)
- **"Guatemala "** (with trailing space) → Q60 (should be Q25)

The zone classification logic in `getDeliveryZone()` is correct, AND the acceptance recalculation in `useDashboardActions.tsx` (lines 781-826) is correct. The problem is that the **admin quote generation flow** in `AdminActionsModal.tsx` does NOT pass `destinationCountry` to `generateQuoteForAdminStatusChange()`. While `adminQuoteGeneration.ts` has a fallback (`destinationCountry || currentPackage.package_destination_country`), there may be cases where `confirmed_delivery_address` was not yet populated when the admin changed status to `quote_sent`, AND the shopper acceptance recalculation was bypassed (e.g., admin moved status directly to `payment_pending`).

Additionally, if the shopper accepts with a discount code applied, the branch at line 765 saves discount data but does **NOT** recalculate the delivery fee — skipping the fix entirely.

### Fix Plan

**File: `src/components/admin/AdminActionsModal.tsx`** (~line 177)
- Pass `destinationCountry` to `generateQuoteForAdminStatusChange`:
```typescript
destinationCountry: pkg.package_destination_country
```

**File: `src/hooks/useDashboardActions.tsx`** (~line 765-780)
- In the discount-only branch (`else if (quoteData.discountCodeId && ...)`), add delivery fee recalculation before saving the discount, using the same `createNormalizedQuote` logic from the no-change branch (lines 789-825). This ensures the delivery fee is corrected even when a discount is applied.

**File: `src/hooks/useDashboardActions.tsx`** (~line 170, admin status change handler)
- When admin changes status directly to `payment_pending` (bypassing shopper acceptance), add a recalculation guard that normalizes the quote with the correct `cityArea` before saving.

### Immediate Data Fix
- Use an edge function to correct the 3+ packages currently in active statuses with wrong delivery fees (Villa Canales Q60→Q45, Santa Catarina Pinula Q60→Q45, Mixco Q60→Q45, etc.).

