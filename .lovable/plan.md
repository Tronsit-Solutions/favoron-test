

## Fix: Mobile multi-quote selector — select first, confirm after

### Problem
On mobile, each quote card has its own "Aceptar esta cotización" button, making the modal long and cluttered. The user wants a **select-then-confirm** pattern: tap a card to select it, then a single sticky confirm button at the bottom.

### Changes

**1. `src/components/dashboard/MultiQuoteSelector.tsx`** — Add selection state + single confirm button

- Add `selectedId` state (initially null)
- Remove the per-card `Button` from each quote card
- Make each card tappable: clicking a card sets `selectedId` to that assignment's ID
- Add a visual selected state: ring/border highlight + checkmark on the selected card
- Add a single "Aceptar esta cotización" button at the bottom, enabled only when `selectedId` is set
- On desktop (non-mobile), keep current behavior (button per card) for backwards compatibility — or apply universally since the select-then-confirm pattern works well on all sizes

**2. `src/components/dashboard/CollapsiblePackageCard.tsx`** (line 1374) — Make dialog mobile-friendly

- Add responsive classes to `DialogContent`: `max-w-2xl sm:max-w-2xl max-h-[85vh] overflow-y-auto` so it scrolls properly on mobile

### UX flow (new)
1. User sees quote cards without individual accept buttons
2. User taps a card → it highlights with a primary border/ring
3. A sticky bottom button appears: "✓ Aceptar esta cotización"
4. User taps the button → triggers `onAcceptQuote(selectedId)`

