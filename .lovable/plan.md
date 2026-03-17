

## Merge quote selection + acceptance into a single flow with payment transition

### Problem
Currently, the shopper picks a quote in MultiQuoteSelector → `shopper_accept_assignment` RPC runs → package goes to `quote_sent` → shopper must separately open QuoteDialog to accept the quote and proceed to payment. The user wants to skip the `quote_sent` intermediate step by adding delivery method toggle, discount code, and T&C checkboxes directly into the MultiQuoteSelector, then transitioning straight to the payment step.

### Changes

**1. `src/components/dashboard/MultiQuoteSelector.tsx`** — Add pre-acceptance fields

When a quote card is selected, show below the traveler details:
- **Delivery method toggle** (RadioGroup: "Recoger en punto de entrega" = free, "Entrega a domicilio" = fee) — replicated from QuoteDialog lines 1346-1391
- **Total price display** that recalculates based on delivery method selection
- **Discount code input** — replicated from QuoteDialog lines 1450-1517 (input + apply button + success state with remove option)
- **Terms & conditions checkbox** — "Entiendo y acepto los términos y condiciones de Favorón" with link to TermsAndConditionsModal
- **Delivery time confirmation checkbox** — "He revisado que el paquete llega a tiempo a la dirección proporcionada"
- Disable the "Aceptar esta cotización" button until both checkboxes are checked

New props needed:
- `packageDetails` (delivery_method, shopper_trust_level, cityArea, package_destination_country, products_data) for price recalculation
- `shopperId` for discount code validation
- `onAcceptQuote` signature updated to pass additional data: `(assignmentId: string, extras: { deliveryMethod, discountData?, message? }) => Promise<void>`

**2. `src/components/dashboard/CollapsiblePackageCard.tsx`** — Pass package context to MultiQuoteSelector

- Pass `pkg` details to MultiQuoteSelector in both inline and modal usages (lines 1130-1136 and 1381-1388)
- After `onAcceptMultiAssignmentQuote` succeeds, instead of just closing the modal, transition to a payment step (render `QuotePaymentStep` inside the same modal, similar to QuoteDialog's wizard pattern)
- Add wizard state (`step: 'select' | 'payment'`) to the multi-quote modal
- After acceptance, fetch the updated package and render `QuotePaymentStep`

**3. `src/hooks/useDashboardActions.tsx`** — Update `handleAcceptMultiAssignmentQuote` (lines 2261-2289)

- Accept additional data from the MultiQuoteSelector (delivery method change, discount code data)
- Before calling `shopper_accept_assignment`, update the package's delivery_method if changed
- After `shopper_accept_assignment`, also call `accept_quote` RPC to go directly to `payment_pending` (skipping the `quote_sent` step)
- Apply discount data to the quote if provided
- Return the updated package so the caller can transition to the payment step

### UX Flow (new)
1. Shopper opens multi-quote modal → sees quote cards
2. Taps a card → expands with traveler details + delivery method toggle + discount code + checkboxes
3. Adjusts delivery method → total recalculates live
4. Optionally enters discount code → validates and shows savings
5. Checks both required checkboxes
6. Taps "Aceptar esta cotización" → runs `shopper_accept_assignment` + `accept_quote` in sequence
7. Modal transitions to `QuotePaymentStep` (bank transfer / card payment)

### Technical notes
- Price recalculation uses `getPriceBreakdown()` and `usePlatformFeesContext()` — same as QuoteDialog
- Discount validation uses `validate_discount_code` RPC — same as QuoteDialog
- The `accept_quote` RPC after `shopper_accept_assignment` mirrors what happens in `handleQuoteSubmit` for the existing single-assignment flow (line 898)
- TermsAndConditionsModal is already a standalone component that can be imported

