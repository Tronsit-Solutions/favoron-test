

## Plan: Simplify Referral Banner

Remove the referral code display from the `ReferralBanner` component. Keep only the "Copiar link" button since that's the only actionable element.

### Changes

**`src/components/dashboard/ReferralBanner.tsx`**

- Remove the `<code>` element showing `{referralCode}` and the copy icon button next to it
- Keep only the "Copiar link" button
- Simplify the right-side layout to just the single button

