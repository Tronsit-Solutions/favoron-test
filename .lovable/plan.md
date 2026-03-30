

## Fix: Expire package_assignments when quotes expire

### Problem
When `expire_old_quotes()` runs, it sets the package status to `quote_expired` and clears `matched_trip_id`, but the related rows in `package_assignments` remain as `bid_submitted`. These "zombie" assignments are counted in the "Productos Pendientes" totals in the admin match dialog.

### Solution
Update the `expire_old_quotes()` SQL function to also set all active `package_assignments` for that package to `bid_cancelled` when the quote expires.

### Changes

**1. Database migration — update `expire_old_quotes()` function**

Add this line inside the loop, after updating the package:

```sql
-- Cancel all active assignments for this package
UPDATE public.package_assignments
SET status = 'bid_cancelled', updated_at = NOW()
WHERE package_id = package_record.id
  AND status IN ('bid_pending', 'bid_submitted', 'bid_won');
```

**2. One-time data cleanup — fix existing stale assignments**

Run via the insert tool (not migration) to retroactively fix assignments that are already stuck:

```sql
UPDATE public.package_assignments
SET status = 'bid_cancelled', updated_at = NOW()
WHERE status IN ('bid_submitted', 'bid_pending', 'bid_won')
  AND package_id IN (
    SELECT id FROM public.packages
    WHERE status IN ('quote_expired', 'approved', 'quote_rejected')
      AND matched_trip_id IS NULL
  );
```

### Files
- New migration: `expire_old_quotes()` function update
- Data fix via insert tool

