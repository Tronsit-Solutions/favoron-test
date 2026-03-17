

## Fix: Old assignment status names still being written to `package_assignments`

### Root cause

The migration renamed existing rows but **missed updating the code paths that WRITE statuses** and the **column default**. So new operations still insert/update with old names (`quote_sent`, `pending`, `rejected`), and the frontend filters using old names too — causing assignments to become invisible.

### All locations to fix

**SQL Migration:**

1. **Column default** — `'pending'` → `'bid_pending'`
   ```sql
   ALTER TABLE package_assignments ALTER COLUMN status SET DEFAULT 'bid_pending';
   ```

2. **Fix any rows written with old names since the last migration:**
   ```sql
   UPDATE package_assignments SET status = 'bid_submitted' WHERE status = 'quote_sent';
   UPDATE package_assignments SET status = 'bid_lost' WHERE status = 'rejected';
   UPDATE package_assignments SET status = 'bid_pending' WHERE status = 'pending';
   ```

**Frontend — writes (critical):**

| File | Line | Old value | New value |
|---|---|---|---|
| `useDashboardActions.tsx` | 410 | `status: 'quote_sent'` | `status: 'bid_submitted'` |
| `useDashboardActions.tsx` | 1468 | `status: 'quote_sent'` | `status: 'bid_submitted'` |
| `useDashboardActions.tsx` | 1391 | `status: 'rejected'` | `status: 'bid_lost'` |
| `useDashboardActions.tsx` | 1393 | `.not('status', 'eq', 'rejected')` | `.not('status', 'eq', 'bid_lost')` |

**Frontend — reads/filters:**

| File | Line | Old value | New value |
|---|---|---|---|
| `Dashboard.tsx` | 347 | `['pending', 'quote_sent']` | `['bid_pending', 'bid_submitted']` |
| `useAdminTips.tsx` | 126 | `['pending', 'quote_sent']` | `['bid_pending', 'bid_submitted']` |
| `AdminMatchingTab.tsx` | 114 | `.not('status', 'eq', 'rejected')` | `.not('status', 'eq', 'bid_lost')` |

### Files to edit
1. SQL migration — fix column default + clean up stale old-name rows
2. `src/hooks/useDashboardActions.tsx` — 3 status writes + 1 filter
3. `src/components/Dashboard.tsx` — 1 filter
4. `src/hooks/useAdminTips.tsx` — 1 filter
5. `src/components/admin/AdminMatchingTab.tsx` — 1 filter

