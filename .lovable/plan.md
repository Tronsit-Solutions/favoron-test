

## Fix: "Productos Enviados" count should include all post-payment statuses

### Problem
The `completed_product_count` column in `get_monthly_package_stats()` only counts products from packages with `status = 'completed'`. It should include all post-payment statuses, matching the GMV logic we just updated.

### Solution

**1. Database migration** — Update the `get_monthly_package_stats()` function to change the product count filter from `status = 'completed'` to the full post-payment status list:

```sql
COALESCE(SUM(
  CASE WHEN p.status IN (
    'pending_purchase','purchase_confirmed','shipped','in_transit',
    'received_by_traveler','pending_office_confirmation',
    'delivered_to_office','ready_for_pickup','ready_for_delivery',
    'out_for_delivery','completed'
  ) AND p.products_data IS NOT NULL
  THEN jsonb_array_length(p.products_data)
  ELSE 0 END
), 0)::bigint AS completed_product_count
```

**2. Rename the KPI label** — Change "Productos Enviados" to "Productos Pagados" (since it now includes all post-payment statuses, not just completed/delivered ones).

No other files need changes — the frontend already reads `completed_product_count` and displays it.

