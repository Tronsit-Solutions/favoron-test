

## Plan: Clarify Recurrence KPI Card Descriptions

The user finds three cards confusing because the descriptions are truncated and the metrics aren't self-explanatory.

### Changes in `src/components/admin/cac/CACKPICards.tsx` (RecurrenceKPICards):

1. **"Pedidos / Recurrente"** → Change title to **"Pedidos Promedio"** and description to `"Promedio por shopper que repitió"` — clarifies this is the average number of paid orders among shoppers who bought more than once.

2. **"Viajeros Recurrentes"** → Change description from `"De {n} activos"` to `"Viajeros con 2+ trips aprobados"` — clarifies what "recurrente" means for travelers.

3. **"Trips / Recurrente"** → Change title to **"Trips Promedio"** and description to `"Promedio por viajero que repitió"` — clarifies this is the average trips among travelers who did more than one.

These are label-only changes in the `cards` array of `RecurrenceKPICards`. No logic changes needed.

