

## Show Multi-Assigned Packages in Admin Matches Tab

### Problem
Packages assigned to multiple travelers via `package_assignments` have `matched_trip_id = null` (until the shopper picks a winner). The Matches tab filter requires `matched_trip_id !== null`, so these packages are invisible to admins.

The "Lulu shoes" package is likely in `status: 'matched'` with `matched_trip_id = null` — it appears in the Pending Requests tab instead of Matches.

### Changes

**1. Fetch `package_assignments` in admin context** — `src/components/admin/matching/ActiveMatchesTab.tsx`
- On mount, query `package_assignments` grouped by `package_id` to get assignment counts and traveler info
- Store as a map: `assignmentsMap[packageId] → { count, assignments[] }`

**2. Include multi-assigned packages in the matches list** — `src/hooks/useMatchFilters.tsx`
- Accept an optional `multiAssignedPackageIds: Set<string>` parameter
- In the filter (line 16), also include packages where `pkg.id` is in `multiAssignedPackageIds` (even if `matched_trip_id` is null)

**3. Pass assignment data down** — `src/components/admin/AdminMatchingTab.tsx`
- Fetch `package_assignments` for packages with `status = 'matched'` and `matched_trip_id IS NULL`
- Pass `assignmentsMap` to `ActiveMatchesTab` and through to `MatchCard`
- Also exclude these packages from the "Solicitudes Pendientes" count (they're already being competed for)

**4. Show "Compitiendo (Xpax)" badge** — `src/components/admin/matching/MatchCard.tsx`
- Accept optional `assignmentCount` prop
- When `assignmentCount > 0` and `matched_trip_id` is null, show badge: `⚡ Compitiendo (3pax)`
- Instead of showing a single traveler name, show "X viajeros asignados" or list them
- The MatchCard header would show traveler names from assignments instead of from `matchedTrip`

### Files to edit
- **`src/components/admin/AdminMatchingTab.tsx`** — fetch assignments, pass data down, fix counts
- **`src/hooks/useMatchFilters.tsx`** — accept multi-assigned package IDs in filter
- **`src/components/admin/matching/ActiveMatchesTab.tsx`** — pass assignments to MatchCard
- **`src/components/admin/matching/MatchCard.tsx`** — render "Compitiendo (Xpax)" badge and multi-traveler info

