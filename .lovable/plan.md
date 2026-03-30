

## Fix: GMV should only include product price

### What's wrong

GMV is currently calculated using `quote->>'totalPrice'` which sums product price + service fee + delivery fee. You've clarified that **GMV = product price only** (the `quote->>'price'` field, i.e., the traveler tip/compensation).

### Changes

**1. Database migration — Update `get_monthly_package_stats` RPC**

Change the GMV aggregation from:
```sql
COALESCE((p.quote->>'totalPrice')::numeric, 0)
```
to:
```sql
COALESCE((p.quote->>'price')::numeric, 0)
```

**2. Frontend — `src/hooks/useDynamicReports.tsx`**

Since GMV now equals just the product price (which is the same as traveler tips), the `travelerTips` derivation (`gmv - serviceFee - deliveryFee`) is no longer needed. Simplify:

- `travelerTips` = `gmv` (they're the same thing now)
- `profitMargin` calculation stays the same: `serviceFee / gmv * 100` — now represents fee as % of product value
- `avgPackageValue` stays: `gmv / completedPackages` — now represents avg product price per package
- Update KPI `totalTips` similarly: just use `gmv` directly

**3. Frontend — `src/components/admin/charts/GMVChart.tsx`**

Update the description label from "Valor bruto de paquetes pagados (USD)" to "Valor de productos pagados (USD)" to reflect the corrected definition.

**4. Excel export — `DynamicReportsTab.tsx`**

The revenue export row currently has `Propinas Viajeros (Q): d.travelerTips` — this will now correctly equal GMV. No structural change needed, just ensure labels are consistent.

### Summary
- 1 migration (update RPC)
- 2 files edited: `useDynamicReports.tsx`, `GMVChart.tsx`

