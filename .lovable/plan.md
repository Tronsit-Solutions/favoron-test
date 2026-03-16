

## Show Multi-Traveler Quotes in ShopperPackagePriorityActions

### Problem
The expanded card's `ShopperPackagePriorityActions` component handles the `matched` status with a generic message ("Pronto recibirás una cotización") and **no button**. It has no awareness of multi-assignments or received quotes. Meanwhile, the "Ver Cotizaciones" button only exists in the collapsed card header — the priority actions section (visible when expanded) is completely blind to competing quotes.

### Changes

**File: `src/components/dashboard/shopper/ShopperPackagePriorityActions.tsx`**

1. **Accept new props**: `multiAssignments` and `onShowMultiQuotes` callback
2. **Update `matched` case** in `getActionConfig`: 
   - If `multiAssignments` has quotes (`quote_sent`): show title "⚡ Cotizaciones recibidas", description with count, and button "Ver Cotizaciones (X)" calling `onShowMultiQuotes`
   - If `multiAssignments` exist but all pending: show "Compitiendo (X viajeros) - Esperando cotizaciones"
   - Fallback to current generic message if no multi-assignments

**File: `src/components/dashboard/CollapsiblePackageCard.tsx`**

3. **Pass new props** to `ShopperPackagePriorityActions`:
   - `multiAssignments={multiAssignments}`
   - `onShowMultiQuotes={() => setShowMultiQuoteModal(true)}`

