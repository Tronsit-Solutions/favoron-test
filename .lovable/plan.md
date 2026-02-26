

## Plan: Add Trip ID column between Viajero and Monto

### Changes in `src/components/admin/AdminTravelerPaymentsTab.tsx`

1. **Add `TableHead` for "Trip"** in both table headers (pending and processed) — between "Viajero" and "Monto" (lines 670-671 and 713-714).

2. **Add `TableCell` in `CompactOrderRow`** (after line 295, before Monto cell) — show truncated trip ID: `order.trip_id?.slice(0, 8)...`

3. **Update `colSpan`** in expanded row (line 353) from 5 to 6.

