

## Fix: Recurrente webhook failing on GET verification request

### Root cause

The logs show exactly **one call** to the webhook — a **GET request** from Recurrente to verify the endpoint is alive. The function crashes with `Unexpected end of JSON input` because it tries `req.json()` on a bodiless GET request. After getting a 500, Recurrente considers the endpoint unhealthy and never sends actual POST payment events.

### Solution

**`supabase/functions/recurrente-webhook/index.ts`** — Two fixes:

1. **Handle GET requests** — Return 200 OK immediately for GET requests (Recurrente endpoint verification)
2. **Guard `req.json()`** — Wrap the JSON parse to handle empty bodies gracefully

```typescript
// After CORS OPTIONS handler, add:
if (req.method === 'GET') {
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
```

Additionally, as a fallback for reliability, create a **`verify-recurrente-payment`** edge function that `PaymentCallback.tsx` calls when the user returns with `payment=success`. This covers cases where the webhook is delayed or fails:

**New: `supabase/functions/verify-recurrente-payment/index.ts`** — Accepts `package_id`, looks up the `recurrente_checkout_id`, verifies with the Recurrente API, and applies the same update logic as the webhook (idempotent — skips if already `pending_purchase`).

**`src/pages/PaymentCallback.tsx`** — On `payment=success`, call `verify-recurrente-payment` to actively confirm the payment status rather than relying solely on the webhook.

### After deploying

Once the webhook returns 200 for GET, Recurrente should start delivering POST events for actual payments. The verify-on-callback provides a belt-and-suspenders approach.

