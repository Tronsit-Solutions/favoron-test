

## Change: Show `recurrente_payment_id` instead of `recurrente_checkout_id`

**`src/components/admin/FinancialSummaryTable.tsx`** — Update the "Recurrente ID" column cell (~lines 918-922) to display `recurrente_payment_id` instead of `recurrente_checkout_id`. The field is already fetched in the query (line 100).

Change the cell from:
```tsx
{item.package?.recurrente_checkout_id 
  ? item.package.recurrente_checkout_id.slice(0, 12) + '...' 
  : '-'}
```
To:
```tsx
{item.package?.recurrente_payment_id 
  ? item.package.recurrente_payment_id.slice(0, 12) + '...' 
  : '-'}
```

Optionally update the header from "Recurrente ID" to "Recurrente Payment ID" for clarity.

