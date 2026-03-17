

## Enhance Multi-Quote Comparison Modal

### Problem
The modal is too small (`max-w-lg`) and only shows basic quote pricing. The shopper needs more context to make an informed decision: traveler's partial address, the package reception window, and the delivery date.

### Data available
The `assignment` object already contains everything needed:
- **`traveler_address`**: has `cityArea`, `streetAddress` (partial), `accommodationType`
- **`matched_trip_dates`**: has `first_day_packages`, `last_day_packages` (reception window) and `delivery_date` (turn-in date)

### Changes

**1. `CollapsiblePackageCard.tsx` (line 1374)**
- Increase modal size from `max-w-lg` to `max-w-2xl`

**2. `MultiQuoteSelector.tsx`** — Add two info sections per quoted card:

After the traveler name/route row, add:
- **Shipping info** (partial): `📍 {cityArea}` + accommodation type (e.g. "Casa en Madrid")
- **Reception window**: `📦 Recibe paquetes: {first_day_packages} - {last_day_packages}` (from `matched_trip_dates`)
- **Delivery date**: `🚚 Entrega en oficina: {delivery_date}` (from `matched_trip_dates`)

Layout: compact rows with icons, between the traveler header and the price breakdown. Uses `format(date, 'dd MMM yyyy', { locale: es })` consistent with existing code.

### Files to edit
1. `src/components/dashboard/CollapsiblePackageCard.tsx` — modal width
2. `src/components/dashboard/MultiQuoteSelector.tsx` — add traveler details section

