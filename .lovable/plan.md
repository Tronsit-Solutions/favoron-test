

## Plan: Add Recurrence/Retention Metrics for Monetized Users

Add a new "Recurrencia" section to the CAC Analysis tab showing how many shoppers and travelers repeat.

### 1. `src/hooks/useCACAnalytics.tsx` — Compute recurrence metrics

Inside the existing `useMemo`, using data already fetched:

- **Shopper recurrence**: From `paidPackagesByUser` (already exists), count users with 1 paid package vs 2+ paid packages. Calculate repeat rate = users with 2+ / total monetized.
- **Traveler recurrence**: Count trips per user from `tripsData` (approved+ statuses). Users with 2+ approved trips = repeat travelers. Calculate repeat rate.
- Export new `RecurrenceKPIs` interface with: `monetizedShoppers`, `oneTimerShoppers`, `repeatShoppers`, `shopperRepeatRate`, `avgOrdersPerRepeatShopper`, `totalTravelers`, `oneTimeTravelers`, `repeatTravelers`, `travelerRepeatRate`, `avgTripsPerRepeatTraveler`.
- Return `recurrenceKPIs` from the hook.

### 2. `src/components/admin/cac/CACKPICards.tsx` — New `RecurrenceKPICards` component

- 6 KPI cards in a grid: Shoppers que Repiten (count + %), Shoppers 1 Vez, Pedidos/Shopper Recurrente, Viajeros que Repiten (count + %), Viajeros 1 Vez, Trips/Viajero Recurrente.
- Use distinct color scheme (amber/warm tones).

### 3. `src/components/admin/cac/CACAnalysisTab.tsx` — Add Recurrence section

- Add a new "Recurrencia de Usuarios Monetizados" section after the General section (before Shoppers), with a `Repeat` icon header.
- Render `RecurrenceKPICards` with the new data.
- Include the recurrence data in the Excel export as a new sheet.

