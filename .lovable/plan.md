

## Fix: Auto-refresh after Recurrente card payment

### Problem
When the user pays via Recurrente (especially "open in new tab"), the `verify-recurrente-payment` edge function updates the package status in the DB, but the dashboard never re-fetches. The `postMessage` from the iframe only works if the payment happens inside the iframe on the same origin — opening in a new tab breaks this communication channel.

### Solution
Add polling in `RecurrenteCheckout.tsx` that checks the package status once the checkout URL is shown. When the package transitions to `pending_purchase` (or `payment_pending_approval`), automatically call `onSuccess()`.

### Changes

**`src/components/payment/RecurrenteCheckout.tsx`** — Add a `useEffect` that polls the `packages` table every 3 seconds while the checkout URL is displayed. If status changes to a post-payment state, fire `onSuccess()`.

```typescript
// New useEffect after checkoutUrl is set
useEffect(() => {
  if (!checkoutUrl || !pkg.id) return;
  
  let active = true;
  const poll = async () => {
    while (active) {
      await new Promise(r => setTimeout(r, 3000));
      if (!active) break;
      const { data } = await supabase
        .from('packages')
        .select('status')
        .eq('id', pkg.id)
        .single();
      if (data && ['pending_purchase', 'payment_pending_approval'].includes(data.status) 
          && data.status !== pkg.status) {
        onSuccess?.();
        break;
      }
    }
  };
  poll();
  return () => { active = false; };
}, [checkoutUrl, pkg.id]);
```

This is lightweight (single-row query every 3s), stops as soon as success is detected or the component unmounts, and works regardless of whether payment happens in iframe or new tab.

