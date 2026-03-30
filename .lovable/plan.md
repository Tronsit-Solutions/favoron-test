

## Plan: Add "Total Productos Enviados" KPI Metric

### What
Add a new KPI card showing the total number of individual products across completed packages. Since each package can contain multiple products in its `products_data` JSONB array, this metric counts the sum of all product quantities.

### How

**1. Update the `get_monthly_package_stats` RPC function** (migration)
- Add a new return column `completed_product_count` that sums `jsonb_array_length(products_data)` for completed packages
- This counts individual product entries per package

**2. Update frontend types and data flow** (`src/hooks/useDynamicReports.tsx`)
- Add `completed_product_count` to `MonthlyPackageStats` interface
- Add `totalProducts` to `KPIData` interface
- Aggregate total products from all monthly package data
- Pass it through to the KPIs object

**3. Add KPI card** (`src/components/admin/charts/KPICards.tsx`)
- Add `totalProducts` to the KPICardsProps interface
- Add a new card with a `ShoppingCart` icon showing total products shipped
- Place it after "Total Solicitudes" to show the relationship (packages → products)
- Update grid to accommodate 8 cards

### Technical Detail

```sql
-- New column in RPC return:
COALESCE(SUM(
  CASE WHEN p.status = 'completed' AND p.products_data IS NOT NULL
  THEN jsonb_array_length(p.products_data)
  ELSE 0 END
), 0)::bigint AS completed_product_count
```

