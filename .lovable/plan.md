

## Why the record count differs: 31 vs 35

### Root cause

The **FinancialSummaryTable** includes cancelled-but-paid packages (`cancelled`, `archived_by_shopper` with payment evidence), while the **RevenueDetailSheet** does not.

Specifically:
- **FinancialSummaryTable** queries statuses: 11 active states + `cancelled` + `archived_by_shopper` (with client-side filter for payment receipt or card payment). This gives **35 rows**.
- **RevenueDetailSheet** queries only the 11 `ACTIVE_STATUSES`. It intentionally skips cancelled-but-paid because they net to zero revenue. This gives **31 rows**.

The ~4 missing records are cancelled-but-paid packages. They appear in the financial table (showing both income and cancellation as a net-zero line) but are excluded from the revenue detail sheet.

### Fix

Add cancelled-but-paid packages to the RevenueDetailSheet so the record count matches. They would show as Q0.00 net or as two offsetting lines (income + cancellation), consistent with the financial table.

**`src/components/admin/charts/RevenueDetailSheet.tsx`**:
1. Expand the query to also fetch `cancelled` and `archived_by_shopper` packages with a quote
2. Client-side filter: keep only those with payment evidence (receipt or `recurrente_payment_id`)
3. Add them as line items with type `"cancelled"` and serviceFee of Q0.00 (or show the fee struck through)
4. They do NOT affect the summary totals (net zero)

This aligns both views so admins see the same package count everywhere.

