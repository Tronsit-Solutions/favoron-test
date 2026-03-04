

## Root Cause: Wrong field used for delivery zone classification

The delivery fee is Q60 instead of Q45 because when quotes are generated via the **traveler quote flow** in `useDashboardActions.tsx`, the code passes `selectedPackage.package_destination` (which is "Guatemala City") to the zone classifier instead of `confirmed_delivery_address.cityArea` (which is "Fraijanes").

The zone classifier sees "Guatemala City" and since it doesn't match any department municipality, it defaults to... well, actually it would match `guatemala_city` zone (Q25). But the real issue is that `normalizeQuote` is called **without the `fees` parameter**, so it falls back to hardcoded constants. Let me verify — the `getDeliveryFee` function without `fees` uses `PRICING_CONFIG` constants which may not have the three-tier system.

Actually, looking more carefully: `package_destination = "Guatemala City"` would match the `guatemala_city` zone and give Q25, not Q60. But the quote shows Q60. This suggests the quote was set with a `message` by the traveler, and the `deliveryFee: 60` was part of the original `quoteData` that came in, and `normalizeQuote` didn't correct it because it wasn't passing `fees`.

### The fix: 4 locations in `useDashboardActions.tsx`

All calls to `normalizeQuote`/`createNormalizedQuote` need to:
1. Use `confirmed_delivery_address.cityArea` instead of `package_destination`
2. Pass `fees` (dynamic delivery fees from PlatformFeesContext)

**Lines to fix:**

1. **Line 371**: `normalizeQuote(quoteData, ..., selectedPackage.package_destination, rates)`
   → Add cityArea extraction, pass `cityArea || selectedPackage.package_destination`, add `fees`

2. **Line 386**: Same fix

3. **Line 648**: Same fix  

4. **Line 691**: `createNormalizedQuote(..., selectedPackage.package_destination, rates, {...fees})`
   → Use `cityArea || selectedPackage.package_destination`

### Additional: Backfill the Fraijanes package

After the code fix, run the existing `fix-delivery-fees-v3` edge function to correct the Fraijanes package (and any other affected active packages) from Q60 to Q45.

### Summary
- Single file change: `src/hooks/useDashboardActions.tsx` (4 call sites)
- Invoke `fix-delivery-fees-v3` to correct existing wrong quotes

