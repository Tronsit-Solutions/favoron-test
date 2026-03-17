

## Simplify quote breakdown in MultiQuoteSelector

Remove the individual line items (Propina viajero, Tarifa de servicio) from the expanded quote details. Only show the total price, since it's already displayed on the card header and the breakdown is unnecessary for the shopper.

### Change — `src/components/dashboard/MultiQuoteSelector.tsx` (lines 182-202)

Remove the entire "Quote breakdown" section. The total is already visible on each card's header row (line 135: `formatPrice(quoteValues.totalPrice)`), so no replacement is needed. Only the traveler logistics details (address, dates) remain in the expanded area.

