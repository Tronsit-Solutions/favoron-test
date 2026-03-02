

## Analysis: Quote Generation and Delivery Fees

The 3-tier zone classification (`guatemala_city`, `guatemala_department`, `outside`) is working correctly. The `getDeliveryZone()` function properly classifies destinations, and all quote generation paths use it.

**However, there is a gap**: `getPriceBreakdown()` does NOT pass the dynamic DB delivery fees to `getDeliveryFee()`. It only passes `rates` for service fees. This means:

- Service fees: correctly use DB values (dynamic rates passed through)
- Delivery fees: use hardcoded constants from `constants.ts` (Q25, Q45, Q60), NOT the DB values

Right now the constants match the DB defaults, so quotes are correct. But if you ever change delivery fees from the admin panel (e.g., Q30 instead of Q25), new quotes would still use the old hardcoded values.

### Fix

Update `getPriceBreakdown()` in `src/lib/pricing.ts` to also accept and pass delivery fee config:

1. Add an optional `fees` parameter (same structure `getDeliveryFee` already accepts)
2. Pass it through to `getDeliveryFee()`
3. Update callers (`createNormalizedQuote`, `QuoteDialog`) to pass delivery fees when available

### Files to modify
- `src/lib/pricing.ts` — add `fees` param to `getPriceBreakdown`, pass to `getDeliveryFee`
- `src/lib/quoteHelpers.ts` — accept and pass `fees` in `createNormalizedQuote` and `normalizeQuote`
- `src/utils/adminQuoteGeneration.ts` — fetch delivery fees from DB and pass them through
- `src/components/QuoteDialog.tsx` — pass delivery fees from `PlatformFeesContext`

This ensures that when you change delivery fees in the admin panel, all new quotes will reflect those changes immediately.

