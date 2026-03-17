

## Fix: "lulu shoes" and "vinito" not showing in Matches tab

### Investigation findings

Both packages (`lulu shoes` id:`5c90d55b`, `vinito` id:`e00005a7`) have:
- `status = 'matched'`
- `matched_trip_id = NULL`
- Active `package_assignments` (bid_pending/bid_submitted)

The data pipeline works in 3 stages:
1. **Data fetch** (`useAdminData.fetchMatchedPackages`) — query `.or('matched_trip_id.not.is.null,status.in.(matched,quote_sent)')` correctly includes these packages
2. **Assignment fetch** (`AdminMatchingTab` useEffect) — queries `package_assignments` excluding `bid_lost`, returns 4 rows including both packages' assignments
3. **Client filter** (`useMatchFilters`) — checks `matched_trip_id != null || multiAssignedPackageIds.has(pkg.id)`

All 3 stages should work. However, I found two issues:

**Issue 1: `products_data` missing from `fetchMatchedPackages` query**
The `fetchMatchedPackages` select list (line 178-208 in `useAdminData.tsx`) does NOT include `products_data`. When the merge happens (line 612-623), the matchedPkgs version overwrites the paginatedPackages version, stripping `products_data`. This causes incomplete data rendering.

**Issue 2: `package_destination_country` missing from `fetchMatchedPackages`**
Same problem — field is selected in `fetchAdminPackages` but not in `fetchMatchedPackages`.

### Plan

**File: `src/hooks/useAdminData.tsx`**

1. Add `products_data` and `package_destination_country` to the `fetchMatchedPackages` select list (around line 208, before `payment_method`)

2. Improve the merge logic (lines 612-623) to preserve ALL fields from both sources — spread existing first, then new package on top, so no fields are lost:
```tsx
allPackagesMap.set(pkg.id, {
  ...existing,  // preserve fields from earlier source
  ...pkg,       // override with newer data
  profiles: pkg.profiles || existing.profiles
});
```

This ensures that even if one query fetches more columns than another, no data is lost during the merge.

### Files to edit
1. `src/hooks/useAdminData.tsx` — add missing fields + fix merge logic

