

## Fix: Assignment status should be `bid_pending`, not `pending`

**Problem**: When an admin assigns travelers to a package, the `package_assignments` rows are created with `status: 'pending'` (line 1279 in `useDashboardActions.tsx`). This violates the `bid_` prefix convention and causes those assignments to not be picked up correctly by queries that filter on `bid_pending`.

**Fix**: One line change in `src/hooks/useDashboardActions.tsx`:

- **Line 1279**: Change `status: 'pending'` to `status: 'bid_pending'`

Additionally, the existing rows in the database with `status = 'pending'` should be corrected. After the code fix, a one-time SQL update can be run:
```sql
UPDATE package_assignments SET status = 'bid_pending' WHERE status = 'pending';
```

### File
- `src/hooks/useDashboardActions.tsx` — line 1279

