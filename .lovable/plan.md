

## Plan: Fix dynamic referral amount parsing and update defaults

The DB already stores the correct values (`referral_reward_amount: {"amount": 20}`, `referred_user_discount: {"amount": 20}`). The bug is that `ReferralBanner.tsx` parses `referral_reward_amount` as a plain number (`Number(rewardRes.data.value)`) instead of extracting `value.amount` from the JSON object. Also, fallback defaults are outdated.

### Changes

**`src/components/dashboard/ReferralBanner.tsx`**
- Update defaults from `15`/`25` to `20`/`20`
- Fix `rewardAmount` parsing: extract `.amount` from the JSON object (same pattern as `discountAmount`)
- Update fallbacks to `20`

**`src/components/profile/ReferralSection.tsx`**
- Update `discountAmount` default from `15` to `20`
- Update fallback from `15` to `20`

### Technical Detail

Both `app_settings` keys store JSON objects like `{"amount": 20}`. The discount parsing already handles this correctly, but the reward parsing does not -- it tries `Number(value)` on an object, which yields `NaN`, falling back to the stale default of `25`.

