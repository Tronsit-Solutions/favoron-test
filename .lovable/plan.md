

## Plan: Move UserLevelCard up below ProfileHeader

### Change

**File: `src/components/UserProfile.tsx`**

Move `<UserLevelCard userLevel={userLevel} />` from the bottom of the main profile view to right after `<ProfileHeader>`, before the Referral Balance card.

Current order: ProfileHeader → Balance → Grid → Personal → Banking → **UserLevelCard** → UserStats

New order: ProfileHeader → **UserLevelCard** → Balance → Grid → Personal → Banking → UserStats

