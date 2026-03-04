

## Change Ana Enriquez's package from delivery to pickup

### Package
- **ID**: `11f3f330-62ee-4f00-a148-c43472522f2e`
- **Current**: delivery_method = "delivery", deliveryFee = Q60, totalPrice = Q127.50
- **Status**: quote_sent

### What I'll do

Deploy a temporary edge function (service role) to:

1. Update `delivery_method` from `"delivery"` to `"pickup"`
2. Recalculate the quote removing the delivery fee:
   - price: Q45 (unchanged)
   - serviceFee: Q22.50 (unchanged)
   - deliveryFee: 0
   - totalPrice: Q67.50 (was Q127.50)
3. Clear `confirmed_delivery_address` since pickup doesn't need it

### Why edge function
The quote is already sent to the shopper. A direct admin update via the UI would trigger normalizeQuote recalculation logic. Using service role ensures a clean, precise update without side effects.

