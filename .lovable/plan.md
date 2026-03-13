

## Add "Back to Quote" button in Payment Modal

### What
Add an `onBackToQuote` optional callback prop to `ShopperPaymentInfoModal`. When provided, show an `ArrowLeft` back button in the header that closes the payment modal and opens the quote dialog.

### Changes

**1. `src/components/dashboard/shopper/ShopperPaymentInfoModal.tsx`**
- Add optional `onBackToQuote?: () => void` prop
- In the `DialogHeader` (line ~384), add a back button before the title that calls `onBackToQuote` when clicked (only shown when prop is provided)

**2. `src/components/dashboard/CollapsiblePackageCard.tsx`**
- Pass `onBackToQuote` to `ShopperPaymentInfoModal` that closes the payment modal and calls `onQuote(pkg, 'user')` to reopen the quote dialog

