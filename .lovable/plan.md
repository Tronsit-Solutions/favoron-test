

## Plan: Remove hover highlight from profile cards

### Changes

**1. `src/components/profile/ProfileHeader.tsx` (line 22)**
- Remove `hover:bg-accent/50` from the Card className so there's no orange/accent background on hover.

**2. `src/components/profile/ProfileNavigationCard.tsx` (line 27)**
- Remove `hover:bg-accent/50 hover:shadow-sm` from the button className so the navigation cards don't highlight on hover either.
- Keep `active:scale-[0.98]` for press feedback.

