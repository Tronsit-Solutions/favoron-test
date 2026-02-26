

## Plan: Remove referral balance card from profile

**File: `src/components/UserProfile.tsx`**

- Remove the "Saldo de referidos" `<Card>` block (the one showing `Q{balance}` with the Wallet icon) from the main profile view
- Remove the `useReferrals` import and hook call since it's only used there
- Remove the `Wallet` icon import if no longer used

