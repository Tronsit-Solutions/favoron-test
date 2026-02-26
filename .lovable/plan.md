

## Plan: Make reward amount dynamic in ReferralBanner

**File: `src/components/dashboard/ReferralBanner.tsx`**

The discount amount (Q15) is already fetched dynamically, but the reward amount (Q30) on line 57 is hardcoded.

- Add state `rewardAmount` with default 30
- Fetch `referral_reward_amount` from `app_settings` alongside the existing discount fetch
- Replace hardcoded `Q30` on line 57 with `Q{rewardAmount}`

Single file change, ~10 lines added.

