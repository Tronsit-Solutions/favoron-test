

## Analysis: Statuses are independent — and the plan needs one RLS fix

### Status independence confirmed

Yes, the two tables have completely independent status columns:

| Table | Status tracks | Example values |
|---|---|---|
| `packages.status` | Package lifecycle | `pending_approval` → `approved` → `matched` → `quote_sent` → `payment_pending` → `pending_purchase` → ... → `completed` |
| `package_assignments.status` | Assignment lifecycle | `pending` → `quote_sent` → `quote_accepted` / `rejected` |

The assignment status tells the traveler "what happened with YOUR bid", while the package status tells everyone "where is this package in the overall flow".

### Critical finding: RLS blocks rejected assignments

The current `traveler_has_active_assignment` function (created in the last migration) excludes `rejected`:

```sql
AND pa.status NOT IN ('rejected', 'expired', 'cancelled')
```

This means even if we stop filtering on the frontend, the `packages(*)` join inside the assignment query will return `null` for rejected assignments — the traveler literally can't see the package data. **We must update the function.**

### Proposed changes (3 total)

**1. SQL Migration — Update `traveler_has_active_assignment` function**

Change the exclusion list from `('rejected', 'expired', 'cancelled')` to just `('expired', 'cancelled')`. This lets travelers see package data for assignments they lost. No new policy needed — just updating the existing function.

```sql
CREATE OR REPLACE FUNCTION public.traveler_has_active_assignment(_user_id uuid, _package_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM package_assignments pa
    JOIN trips t ON t.id = pa.trip_id
    WHERE pa.package_id = _package_id
      AND t.user_id = _user_id
      AND pa.status NOT IN ('expired', 'cancelled')
  )
$$;
```

**2. Dashboard.tsx line 298 — Stop hiding rejected assignments**

Change: `['rejected', 'expired', 'cancelled']` → `['expired', 'cancelled']`

This keeps rejected assignments visible in the traveler's dashboard.

**3. No UI changes needed**

`TravelerPackageCard.tsx` already handles the `rejected` state at lines 199-205, showing "❌ Otro viajero fue seleccionado". This will now actually be visible.

### How both sources combine (no duplicates)

| Source | What it shows | Filter |
|---|---|---|
| `directAssignedPackages` (from `packages` table via `matched_trip_id`) | Won packages + legacy single-assignments | `matched_trip_id` matches user's trip |
| `multiAssignedPackages` (from `package_assignments` table) | Pending, competing, and lost bids | Skips if package already visible via `matched_trip_id` (line 296) |

Line 296 prevents duplicates: when a traveler wins and `matched_trip_id` gets set to their trip, the assignment-based entry is skipped because `directAssignedPackages` already shows it. Lost travelers don't have `matched_trip_id` pointing to them, so they only see the package via the assignment path — with the "rejected" UI.

### Files
1. SQL migration — update `traveler_has_active_assignment` function (remove `rejected` from exclusion)
2. `src/components/Dashboard.tsx` — line 298, remove `rejected` from filter array

