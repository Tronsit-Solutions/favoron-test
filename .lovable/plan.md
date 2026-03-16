

## Confirmation: Multi-assigned packages are invisible to travelers

You are correct. When the admin assigns a package to 2+ travelers:

1. **`matched_trip_id` stays `null`** on the package (by design, per the multi-traveler assignment logic in `useDashboardActions.tsx` lines 1263-1276)
2. **The traveler dashboard** (`Dashboard.tsx` line 267-275) only shows packages where `pkg.matched_trip_id` matches one of the user's trip IDs
3. **Result**: Neither traveler can see the package, even though rows exist in `package_assignments`

### What's needed (Phase 2)

To fix this, the traveler dashboard needs to also query `package_assignments` for packages assigned to the traveler's trips. The approach:

1. **Fetch `package_assignments`** where `trip_id` is in the user's trip IDs, joining with `packages` data
2. **Merge** these assignments into the `assignedPackages` list in `Dashboard.tsx`, so they appear nested under the correct trip (in `TripPackagesGroup`)
3. **Differentiate UI** for multi-assignment packages — the traveler should see they're "competing" and can submit their quote/tip
4. **Use assignment-level data** (tip, quote, status) from `package_assignments` instead of the package-level fields when in multi-assignment mode

### Files to change

- **`src/hooks/useDashboardData.tsx`** (or equivalent data hook) — Add a query to fetch `package_assignments` for the user's trips, with joined package data
- **`src/components/Dashboard.tsx`** — Expand `assignedPackages` logic to include packages from `package_assignments` (not just `matched_trip_id`), mapping assignment-level fields onto the package object
- **`src/components/dashboard/CollapsibleTravelerPackageCard.tsx`** — Minor UI tweaks to indicate multi-assignment status (e.g., "Compitiendo con otros viajeros")

### Key considerations

- Single-assignment packages (where `matched_trip_id` is set directly) should continue working as-is — no regression
- The quote/tip data for multi-assignments lives in `package_assignments.quote` and `package_assignments.admin_assigned_tip`, not on the package itself
- RLS policies on `package_assignments` already allow travelers to SELECT and UPDATE their own assignments

