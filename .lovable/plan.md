

## Plan: Show countdown timer on desktop for payment_pending status

### Problem
On desktop, the `QuoteCountdown` timer only appears for `quote_sent` status (line 680). The mobile layout (line 403) correctly shows it for `quote_sent`, `quote_accepted`, and `payment_pending`.

### Fix
**File**: `src/components/dashboard/CollapsiblePackageCard.tsx`, line 680

Change the desktop condition from:
```tsx
pkg.status === 'quote_sent'
```
to:
```tsx
['quote_sent', 'quote_accepted', 'payment_pending'].includes(pkg.status)
```

This makes the desktop view consistent with the mobile view, showing the countdown timer whenever payment is still pending and the quote hasn't expired.

