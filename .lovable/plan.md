

## Change Recurrente checkout item name format

Currently the item name sent to Recurrente uses the product description (e.g. "How Did I Get Here? Deluxe Double Vinyl"). The user wants it changed to: `Servicio Favorón ID12345 Delivery fee Q25`.

### Changes

**1. `src/components/payment/RecurrenteCheckout.tsx`** — Replace `getItemDescription()` logic. Instead of using product names, build the string:
```
Servicio Favorón ID{label_number} Delivery fee Q{deliveryFee}
```
- `label_number` comes from `pkg.label_number`
- `deliveryFee` comes from `pkg.quote?.deliveryFee` (already available in the quote JSON)
- Fallback if no label_number: use first 8 chars of package UUID
- Fallback if no deliveryFee or it's 0: omit the delivery fee part

**2. `supabase/functions/create-recurrente-checkout/index.ts`** — No changes needed; it already uses `item_description` from the request body (line 114).

### Single file edit

In `RecurrenteCheckout.tsx`, replace lines 30-41 (`getItemDescription` function) with:

```typescript
const getItemDescription = () => {
  const labelId = pkg.label_number ? `ID${pkg.label_number}` : pkg.id.substring(0, 8);
  const quote = pkg.quote as any;
  const deliveryFee = quote?.deliveryFee || 0;
  const deliveryPart = deliveryFee > 0 ? ` Delivery fee Q${deliveryFee}` : '';
  return `Servicio Favorón ${labelId}${deliveryPart}`;
};
```

