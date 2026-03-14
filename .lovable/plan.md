

## Fix: Clipboard copy fails on mobile/iframe

### Problem
`navigator.clipboard.writeText()` fails in certain contexts (iframes, non-HTTPS, mobile browsers without permissions), causing the "No se pudo copiar" error. There's no fallback mechanism.

### Solution
Create a shared `copyToClipboard` utility that tries `navigator.clipboard.writeText` first, then falls back to the legacy `document.execCommand('copy')` approach with a temporary textarea. Apply it across all 8 files that use clipboard.

### Changes

**New file `src/lib/clipboard.ts`**:
- Export an async `copyToClipboard(text: string): Promise<boolean>` function
- Try `navigator.clipboard.writeText` first
- On failure, create a temporary `<textarea>`, select its content, use `document.execCommand('copy')`, then remove the element
- Return `true`/`false` for success/failure

**Update all files** that use `navigator.clipboard.writeText` to import and use the new utility:
- `src/components/dashboard/ReferralBanner.tsx`
- `src/components/profile/ReferralSection.tsx`
- `src/components/dashboard/ReferralAnnouncementModal.tsx`
- `src/components/PrimePaymentModal.tsx`
- `src/components/quote/QuotePaymentStep.tsx`
- `src/components/AuthModal.tsx`
- `src/components/admin/TrackingInfoViewer.tsx`
- `src/components/dashboard/shopper/ShopperPaymentInfoModal.tsx`

