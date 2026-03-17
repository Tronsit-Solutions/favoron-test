

## Unify Matching Flow + Traveler "Bid Sent" Visual

### Overview
Three categories of changes: (A) remove legacy code paths, (B) update `shopper_accept_assignment` to keep competing quotes alive until payment, (C) update traveler card visuals when their assignment is `quote_sent` but package is still `matched`.

### Changes

**1. Remove legacy fallback — `src/hooks/useDashboardActions.tsx` (~lines 422-431)**
Delete the `else` branch that writes `quote`, `traveler_address`, `matched_trip_dates` directly to the package when no `assignmentId` exists. All matching now creates assignment rows, so this is dead code and a data-corruption risk.

**2. Guard shopper accept branch — `src/hooks/useDashboardActions.tsx` (~line 720)**
Before the `accept_quote` RPC call, add: if `selectedPackage.status === 'matched'`, show a toast error ("Selecciona un viajero primero") and return early. This prevents the shopper from accidentally hitting the old path while assignments are still competing.

**3. Show MultiQuoteSelector for `quote_sent` too — `src/components/dashboard/CollapsiblePackageCard.tsx` (~line 1130)**
Change condition from `pkg.status === 'matched'` to `['matched', 'quote_sent'].includes(pkg.status)`. After `shopper_accept_assignment` promotes a winner, the package goes to `quote_sent` with `matched_trip_id` set, so `!pkg.matched_trip_id` already filters it out correctly — but this covers edge cases where the shopper wants to browse quotes at `quote_sent` without a winner yet.

**4. Update `shopper_accept_assignment` RPC — new SQL migration**
- Keep losing assignments as `quote_sent` (don't reject them yet) so the shopper can change their mind before paying.
- Set the winning assignment to `quote_accepted`.
- Promote winner data to the package row and set `packages.status = 'quote_sent'`.
- Add a new step: when `accept_quote` RPC runs (moves package to `payment_pending`), reject all non-accepted assignments. This is done by adding to the existing `accept_quote` function: `UPDATE package_assignments SET status = 'rejected' WHERE package_id = _package_id AND status != 'quote_accepted'`.

**5. Traveler card visual for "bid sent" — `src/components/dashboard/TravelerPackageCard.tsx` (~lines 176-211)**
The package stays `matched` while the traveler's assignment is `quote_sent`. Currently line 178 checks `pkg.status === 'matched'` and shows "Tip asignado por admin" — wrong for a traveler who already submitted.

Fix: In the `matched` status section, check `pkg._assignmentStatus`:
- If `_assignmentStatus === 'quote_sent'`: Show a green "✅ Cotización enviada" card with the quote total from `pkg._assignmentQuote`, and text "Esperando que el shopper seleccione un viajero".
- If `_assignmentStatus === 'quote_accepted'`: Show "🎉 ¡El shopper te eligió!" message.
- If `_assignmentStatus === 'rejected'`: Show "❌ Otro viajero fue seleccionado" message.
- Otherwise (pending): Keep existing tip display.

Also update the status badge area — when `_assignmentStatus === 'quote_sent'`, show `getStatusBadge` with a custom "Cotización enviada" label instead of the default "Emparejado".

### Files
1. `src/hooks/useDashboardActions.tsx` — Remove legacy fallback + add guard
2. `src/components/dashboard/CollapsiblePackageCard.tsx` — Extend MultiQuoteSelector condition
3. `supabase/migrations/` — Update `shopper_accept_assignment` (don't reject losers) + update `accept_quote` (reject losers on payment)
4. `src/components/dashboard/TravelerPackageCard.tsx` — Assignment-aware visual states

