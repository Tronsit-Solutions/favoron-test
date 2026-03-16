

## Bug Fix: Multi-assigned packages not appearing in Admin Matches tab

### Root Cause
The "lulu shoes" package (`status: matched`, `matched_trip_id: null`, 2 assignments in `package_assignments`) is correctly identified by `multiAssignedPackageIds` and included in `matchedPackages`. However, the **status filter checkbox state** in `ActiveMatchesTab.tsx` drops it.

Here's what happens:
1. On first render, `assignmentsMap` is empty → `multiAssignedPackageIds` is empty → `matchedPackages` only includes packages with `matched_trip_id` (none with status `matched`)
2. `selectedStatuses` initializes to all available statuses (e.g. 10 statuses, NOT including `matched`)
3. `assignmentsMap` loads → `multiAssignedPackageIds` now includes "lulu shoes" → `matchedPackages` gains packages with status `matched`
4. The sync effect runs but since `selectedStatuses` is already non-empty, it only **removes** stale statuses — it never **adds** the new `matched` status
5. Result: packages with `matched` status are filtered out by `selectedStatuses`

### Fix

**File: `src/components/admin/matching/ActiveMatchesTab.tsx`** (lines 176-185)

Update the `selectedStatuses` sync effect to also **add** newly appearing statuses:

```js
useEffect(() => {
  setSelectedStatuses(prev => {
    if (prev.size === 0 && allStatuses.length > 0) {
      return new Set(allStatuses);
    }
    // Keep existing valid statuses AND add any new ones
    const next = new Set([...prev].filter(s => allStatuses.includes(s)));
    allStatuses.forEach(s => {
      if (!next.has(s)) next.add(s);
    });
    return next;
  });
}, [allStatuses]);
```

This ensures that when `matched` status packages appear after `assignmentsMap` loads, the status is automatically selected in the filter.

### Files to edit
- **`src/components/admin/matching/ActiveMatchesTab.tsx`** — fix status filter sync to add new statuses

