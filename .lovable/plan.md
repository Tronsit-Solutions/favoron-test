

## Plan: Fix GMV & Service Fee Charts

### Changes needed:

### 1. Update Supabase RPC `get_monthly_package_stats`
The current RPC only counts GMV/service_fee for `completed` and `delivered_to_office`. Need to expand to all paid-onwards statuses: `pending_purchase`, `payment_pending_approval`, `paid`, `payment_confirmed`, `shipped`, `in_transit`, `received_by_traveler`, `pending_office_confirmation`, `delivered_to_office`, `ready_for_pickup`, `ready_for_delivery`, `completed`.

### 2. Simplify `GMVChart.tsx`
- Remove accumulated GMV line, right Y-axis, `ComposedChart` → simple `BarChart`
- Change currency from Q (Quetzales) to $ (USD)
- Remove `accumulatedGmv` computation
- Header shows total as sum of monthly values in USD

### 3. Simplify `ServiceFeeGrowthChart.tsx`
- Remove accumulated revenue line, right Y-axis, `ComposedChart` → simple `BarChart`
- Keep Q currency (service fees are in Quetzales)
- Remove `accumulatedRevenue` computation

