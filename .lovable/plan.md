

## Add cancellation type indicator to refund detail modal

### Problem
The refund detail modal doesn't clearly show whether the refund is for a full package cancellation or just individual products. This makes it confusing for admins reviewing refund orders.

### How to distinguish
- **Full package cancellation**: The `reason` field starts with "Cancelación completa:" and the `cancelled_products` array contains ALL products from the package. Also, the package status will be `cancelled`.
- **Partial cancellation**: The `reason` doesn't have that prefix, and `cancelled_products` typically has fewer items.

### Changes

**`src/components/admin/AdminRefundsTab.tsx`**:

1. In the detail modal, add a badge/indicator right after the shopper info showing:
   - "Cancelación completa" (orange/red badge) if `reason` starts with "Cancelación completa" or `package.status === 'cancelled'`
   - "Cancelación parcial (X de Y productos)" (yellow badge) otherwise — using `cancelled_products.length` vs total products from `package.products_data`

2. In the refund table rows, add a small type indicator in the Producto(s) column (e.g., a subtle badge or prefix) so admins can see at a glance without opening the detail

3. The `useAdminRefundOrders` hook already fetches `packages.products_data`, so we can count total products from there to show "2 de 5 productos cancelados" for partial cancellations

