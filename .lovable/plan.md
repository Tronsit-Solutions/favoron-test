

## Fix: Include Multi-Assigned Packages in Admin Matches Fetch

### Problem
`fetchMatchedPackages()` in `useAdminData.tsx` line 210 filters with `.not('matched_trip_id', 'is', null)`, so multi-assigned competing packages (which intentionally have `matched_trip_id = null`) are never loaded. The downstream `useMatchFilters` already handles them correctly via `isMultiAssigned` check — the data just never arrives.

### Solution

**File: `src/hooks/useAdminData.tsx`** — Modify `fetchMatchedPackages` to also fetch packages that have active assignments but no `matched_trip_id`:

1. After the existing matched packages query (line 210-212), add a second query: fetch `package_assignments` to get distinct `package_id` values where status is not rejected/cancelled
2. For any package IDs found that aren't already in the matched results, fetch those packages from `packages` table (they'll have `matched_trip_id IS NULL`)
3. Enrich with profiles and merge into the result

Alternatively (simpler): Remove the `.not('matched_trip_id', 'is', null)` filter and instead filter by statuses that indicate an active match exists. Packages in status `matched`, `quote_sent`, `payment_pending`, `in_transit`, `received_by_traveler`, `pending_office_confirmation`, `delivered_to_office`, `ready_for_pickup`, `ready_for_delivery`, `completed` always imply a match exists — either via `matched_trip_id` or via `package_assignments`.

**Recommended approach** (simplest, as the user suggested): Replace the single query with an OR condition — fetch packages where `matched_trip_id IS NOT NULL` **OR** status is in the set of "matched-like" statuses (`matched`, `quote_sent`). This catches multi-assigned packages without needing a join to `package_assignments`.

Concrete change in `fetchMatchedPackages`:
- Remove line 210 (`.not('matched_trip_id', 'is', null)`)
- Add a filter: `.or('matched_trip_id.not.is.null,status.in.(matched,quote_sent)')` — this fetches packages that either have a `matched_trip_id` set OR are in a status that implies they're in a matching/quoting flow
- Keep the existing broken status exclusion (line 211)

### Files to edit
- `src/hooks/useAdminData.tsx` — one line change in `fetchMatchedPackages`

