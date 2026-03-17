

## Fix: Package has stale quote/traveler_address/matched_trip_dates from pre-fix code

### Problem
The "lulu shoes" package (`5c90d55b`) has `quote`, `traveler_address`, and `matched_trip_dates` populated directly on the `packages` row, even though the shopper hasn't selected a winner yet. This happened because Lucas's quote submission hit the legacy fallback path (line 422-430 in `useDashboardActions.tsx`) before the `price` fix was applied — it wrote directly to the package instead of the assignment.

This stale data causes two issues:
1. **QuoteDialog reads from the package** (Dashboard.tsx line 1122-1128): `existingQuote`, `traveler_address`, and `tripDates` are read from the package row, so other travelers or the shopper see Lucas's quote data leaked onto the package.
2. **ShippingInfoRegistry** and other components that check `pkg.traveler_address` may show premature shipping info.

### Fix: Two-part approach

**Part 1: Clean the dirty data (one-time SQL)**
Clear the stale fields on the specific package since the correct data lives in `package_assignments`:
```sql
UPDATE packages
SET quote = NULL, traveler_address = NULL, matched_trip_dates = NULL
WHERE id = '5c90d55b-2e35-44d1-bb59-fda5aeab277c'
  AND status = 'matched'
  AND matched_trip_id IS NULL;
```

**Part 2: For the traveler QuoteDialog, read from the assignment row instead of the package**

In `src/components/Dashboard.tsx` (~line 1115, 1122-1128), when opening the QuoteDialog for a traveler (`quoteUserType === 'user'`), prefer the assignment's data over the package's:
- Read `existingQuote` from `selectedPackageForQuote._assignmentQuote` (the assignment's quote) instead of `selectedPackageForQuote.quote`
- Read `traveler_address` from the assignment instead of the package
- Read `matched_trip_dates` from the assignment instead of the package

This requires the traveler dashboard to attach `_assignmentQuote`, `_assignmentTravelerAddress`, and `_assignmentMatchedTripDates` when hydrating packages from assignments (same pattern already used for `_assignmentId` and `_assignmentStatus`).

### Files to change
1. **SQL migration** — Clean stale data on the lulu shoes package
2. **Traveler data hydration** (where `_assignmentId` / `_assignmentStatus` are set) — also attach `_assignmentQuote`, `_assignmentTravelerAddress`, `_assignmentMatchedTripDates`
3. **`src/components/Dashboard.tsx`** (~line 1115, 1122-1128) — When `quoteUserType === 'user'`, prefer assignment fields over package fields for `existingQuote`, `traveler_address`, and `tripDates`

