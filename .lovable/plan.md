

## Fix: Slow behavior after clicking "Assign"

### Root cause (confirmed)

The slowness comes from one thing: **the unbounded `fetchAssignments` query in `AdminMatchingTab.tsx` (line 113) re-runs every time `packages` changes**.

After clicking Assign:
1. `useDashboardActions` calls `setPackages(...)` (line 1338) — triggers fetchAssignments
2. `AdminDashboard` calls `setLocalPackages(...)` (line 266) — triggers fetchAssignments again
3. Each fetchAssignments does a **full table scan** of `package_assignments` with no package filter

So yes, the plan I proposed is the right approach. The core fixes are:

### Changes

**File: `src/components/admin/AdminMatchingTab.tsx`**

1. **Scope the query** — filter `package_assignments` to only the package IDs that actually need assignment data (packages without `matched_trip_id` that are in `matched`/`quote_sent`/`approved` status). This turns a full table scan into a targeted lookup.

2. **Stabilize the dependency** — replace `[packages]` with a memoized key derived from the sorted relevant package IDs. This prevents refetching when unrelated package fields change (like a status update on a different package).

3. **Debounce** — add a 300ms debounce so the two rapid-fire state updates (from `useDashboardActions` + `AdminDashboard`) collapse into a single fetch.

**File: `src/hooks/useDashboardActions.tsx`**

4. **Remove duplicate state update** — line 1338's `setPackages(...)` is redundant because `AdminDashboard` already does `setLocalPackages(...)` in the `.then()` callback. Removing it eliminates one re-render cycle and one redundant fetch.

5. **Defer side effects** — wrap the WhatsApp/email/history `Promise.all` in a `setTimeout(…, 500)` so these network calls don't compete with the UI-critical assignment query.

### Why this is the right approach

- The **single biggest win** is scoping the query (change 1). It's the difference between fetching thousands of rows vs. tens.
- Changes 2-4 are defensive — they prevent the scoped query from running 2-3 times unnecessarily.
- Change 5 reduces network contention during the critical post-assign window.
- No new dependencies, no architectural changes, no migrations needed.

### Expected result
- Clicking "Assign" feels instant — the tab switch and card move happen without lag
- The assignments query fetches only relevant data, completing in milliseconds instead of seconds
- No more visible "scrappy" re-renders from cascading state updates

