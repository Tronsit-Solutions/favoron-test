

## Add Year filter to Financial Summary Table

### Current behavior
The month selector dropdown shows individual months (e.g. "Ene 2026", "Feb 2026") and "Todos los meses". No way to filter by entire year.

### Changes

**`src/components/admin/FinancialSummaryTable.tsx`**

1. **Extract available years** from `availableMonths` and add year-only options to the Select dropdown. Year values will use format `"year-YYYY"` (e.g. `"year-2026"`) to distinguish from month values (`"2026-01"`).

2. **Update the Select dropdown** (lines 705-716): Add year options between "Todos los meses" and individual months:
   ```
   Todos los meses
   ── Año 2026
   ── Año 2025
   Ene 2026
   Feb 2026
   ...
   ```

3. **Update filtering logic** (lines 510-520): Handle year-prefixed values — when `selectedMonth` starts with `"year-"`, filter by matching year only instead of year+month.

4. **Update the query** (lines 99-103): When `selectedMonth` is a year value, use Jan 1 to Dec 31 of that year as the date range instead of a single month.

5. **Update `selectedMonthDate` memo** (lines 68-72): Return a `{ start, end }` object or handle year case, so the query uses the correct date range.

Minimal touch points — the dropdown gets year entries, the filter/query logic branches on `year-` prefix.

