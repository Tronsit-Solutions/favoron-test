

## Show Competing Travelers Info to Shoppers

### Problem
When a package has multi-traveler assignments, the collapsed card shows generic text "Match con viajero - Esperando cotización" and an "Emparejado" badge. The shopper has no indication that multiple travelers are competing or how many. The MultiQuoteSelector is hidden inside the expanded card.

### Changes

**File: `src/components/dashboard/CollapsiblePackageCard.tsx`**

1. **Update status description** (line 184-188) — When `multiAssignments` exist, show count:
   - If some have `quote_sent`: `"Cotizaciones recibidas de X viajeros - Compara y elige"`
   - If all `pending`: `"⚡ Compitiendo (Xpax) - Esperando cotizaciones"`

2. **Add "Compitiendo" badge in collapsed header** — On both mobile (around line 434) and desktop (around line 749), when `multiAssignments?.length > 0` and `pkg.status === 'matched'` and `!pkg.matched_trip_id`, show a small badge: `⚡ Compitiendo (Xpax)` in amber/orange styling, similar to what was done for admin MatchCard.

3. **Auto-expand card when quotes arrive** — When `multiAssignments` has any `quote_sent` assignments, auto-set `needsAction = true` so the notification badge appears, drawing the shopper's attention.

### Files to edit
- **`src/components/dashboard/CollapsiblePackageCard.tsx`** — update status description, add competing badge to collapsed header, mark as needing action when quotes arrive

