

## Show Multi-Traveler Quotes in the Quote Modal

### Problem
When a competing package receives quotes from multiple travelers, the shopper can only see them inside the expanded card via `MultiQuoteSelector`. There's no prominent button on the collapsed card header to open a modal and compare quotes — the status is `matched` (not `quote_sent`), so the "Ver y Aceptar Cotización" button never renders.

### Solution
Add a "Ver Cotizaciones" button to the collapsed card (both mobile and desktop) for competing packages that have received quotes, and render the `MultiQuoteSelector` inside a dedicated dialog modal when clicked.

### Changes

**File: `src/components/dashboard/CollapsiblePackageCard.tsx`**

1. **Add state** for a new `showMultiQuoteModal` boolean
2. **Add "Ver Cotizaciones" button** in both mobile (line ~632) and desktop (line ~943) action button sections — when `isCompeting && hasMultiQuotes`, show a button like `"⚡ Ver Cotizaciones (X)"` with `variant="success"`
3. **Add a Dialog** at the bottom of the component that renders `MultiQuoteSelector` inside a modal with a title like "Cotizaciones recibidas" — reusing the existing `multiAssignments` and `onAcceptMultiAssignmentQuote` props
4. For competing packages with only pending assignments (no quotes yet), show a disabled/outline button: `"Esperando cotizaciones..."`

### Files to edit
- `src/components/dashboard/CollapsiblePackageCard.tsx`

