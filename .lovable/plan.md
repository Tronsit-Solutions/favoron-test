

## Fix: Service Fee Growth Chart showing incorrect amounts

### Root cause

The PostgreSQL RPC function `get_monthly_package_stats()` filters packages using **outdated status names** that no longer exist in the database. This causes most packages to be excluded from the service fee sum.

**Current RPC statuses (wrong):**
```text
'pending_purchase', 'purchased', 'in_transit', 'arrived',
'pending_delivery', 'delivered', 'completed'
```

**Actual statuses in use (from FinancialSummaryTable - the source of truth):**
```text
'pending_purchase', 'purchase_confirmed', 'shipped', 'in_transit',
'received_by_traveler', 'pending_office_confirmation',
'delivered_to_office', 'ready_for_pickup', 'ready_for_delivery',
'out_for_delivery', 'completed'
```

Statuses like `purchased`, `arrived`, `pending_delivery`, `delivered` don't exist anymore. This means the RPC is missing most post-payment packages, resulting in drastically underreported service fee revenue.

### Solution

**New migration: Update `get_monthly_package_stats()` RPC function**

Replace the WHERE clause status list with the correct current statuses, aligned with `FinancialSummaryTable`:

```sql
WHERE p.status IN (
  'pending_purchase', 'purchase_confirmed', 'shipped',
  'in_transit', 'received_by_traveler',
  'pending_office_confirmation', 'delivered_to_office',
  'ready_for_pickup', 'ready_for_delivery',
  'out_for_delivery', 'completed'
)
```

Also update the `completed_count` filter to include terminal delivery states (not just `'completed'`), and update `pending_count` to reflect the correct in-progress statuses.

### Files to change
- **New SQL migration** — recreate `get_monthly_package_stats()` with correct statuses

### What this fixes
- Service fee totals in the chart will match the Financial Summary Table
- GMV and delivery fee totals will also be corrected (same RPC)
- MoM growth percentages will reflect accurate data

