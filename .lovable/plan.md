

## Plan: Fix GMV & Service Fee RPC to use correct JSON keys

### Problem
The `get_monthly_package_stats` RPC reads `quote->>'total'`, `quote->>'service_fee'`, and `quote->>'delivery_fee'` from the JSON. However, most packages use **camelCase** keys: `totalPrice`, `serviceFee`, `deliveryFee`. Only a few recent packages use the snake_case keys. This is why all months before Feb 2026 show $0 GMV and Q0 service fee.

### Fix: Update the SQL RPC (1 migration)

Update `get_monthly_package_stats` to try both key conventions with COALESCE:

- **GMV**: `COALESCE((quote->>'totalPrice')::numeric, (quote->>'total')::numeric, 0)`
- **Service Fee**: `COALESCE((quote->>'serviceFee')::numeric, (quote->>'service_fee')::numeric, 0)`
- **Delivery Fee**: `COALESCE((quote->>'deliveryFee')::numeric, (quote->>'delivery_fee')::numeric, 0)`

No frontend changes needed. The charts will automatically show correct values for all months once the RPC returns proper data.

