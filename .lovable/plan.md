

## Rename `package_assignments` statuses to differentiate from `packages` statuses

### Current overlap problem

Both tables use identical status names (`quote_sent`, `rejected`, `expired`, `cancelled`), making code confusing and error-prone.

### New naming convention: `bid_*` prefix

| Current (assignment) | New (assignment) | Meaning |
|---|---|---|
| `pending` | `bid_pending` | Assigned, waiting for admin quote |
| `quote_sent` | `bid_submitted` | Quote sent, competing |
| `quote_accepted` | `bid_won` | Shopper chose this traveler |
| `rejected` | `bid_lost` | Another traveler was selected |
| `expired` | `bid_expired` | Assignment timed out |
| `cancelled` | `bid_cancelled` | Assignment cancelled |

### Changes

**1. SQL Migration**

- Update existing rows: `UPDATE package_assignments SET status = 'bid_pending' WHERE status = 'pending'`, etc. for all statuses
- Update `shopper_accept_assignment` RPC: winner → `bid_won`, losers → `bid_lost`
- Update `traveler_has_active_assignment` function: exclude `('bid_expired', 'bid_cancelled')` instead of old names
- Add `dismissed_by_traveler` boolean column (default `false`) for travelers to hide completed/lost assignments

**2. Frontend — Dashboard.tsx (line 296-298)**

- Update filter: `['bid_expired', 'bid_cancelled']` → only hide these (keep `bid_lost` visible)
- Add filter for `dismissed_by_traveler === true`
- Line 296: keep the `matched_trip_id` dedup logic unchanged

**3. Frontend — All files referencing assignment statuses**

Files to update with new status names:
- `TravelerPackageCard.tsx` — lines 180, 192, 199: `quote_sent` → `bid_submitted`, `quote_accepted` → `bid_won`, `rejected` → `bid_lost`
- `TravelerPackagePriorityActions.tsx` — lines 132, 138: `quote_sent` → `bid_submitted`
- `CollapsiblePackageCard.tsx` — lines 170, 189, 674, 1011: `quote_sent` → `bid_submitted`
- `MultiQuoteSelector.tsx` — lines 38-39: `quote_sent` → `bid_submitted`, `pending` → `bid_pending`
- `ShopperPackagePriorityActions.tsx` — line 219: `quote_sent` → `bid_submitted`
- `AdminActionsModal.tsx` — line 194: `pending` → `bid_pending`

**4. Frontend — Add dismiss button + `bid_expired`/`bid_cancelled` UI**

In `TravelerPackageCard.tsx`:
- Add UI states for `bid_expired` ("⏰ Asignación expirada") and `bid_cancelled` ("Asignación cancelada")
- Add "Descartar" button for `bid_lost`, `bid_expired`, `bid_cancelled` that sets `dismissed_by_traveler = true`

### Files
1. SQL migration — rename statuses, update RPC + function, add `dismissed_by_traveler` column
2. `src/components/Dashboard.tsx` — update status filters
3. `src/components/dashboard/TravelerPackageCard.tsx` — new status names + dismiss button + new states
4. `src/components/dashboard/traveler/TravelerPackagePriorityActions.tsx` — new status names
5. `src/components/dashboard/CollapsiblePackageCard.tsx` — new status names
6. `src/components/dashboard/MultiQuoteSelector.tsx` — new status names
7. `src/components/dashboard/shopper/ShopperPackagePriorityActions.tsx` — new status names
8. `src/components/admin/AdminActionsModal.tsx` — new status names

