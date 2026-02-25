

## Plan

Remove the WhatsApp share button from the referral banner and rename the remaining copy button to "Copiar link".

### Changes

**`src/components/dashboard/ReferralBanner.tsx`**
- Remove the `handleWhatsAppShare` function
- Remove the `Share2` icon import
- Remove the 2-column grid with both buttons
- Keep a single "Copiar link" button
- Remove unused imports

**`src/components/profile/ReferralSection.tsx`**
- Same changes: remove WhatsApp button, keep only "Copiar link"
- Remove `handleWhatsAppShare` and `Share2` import

