

## Hide last names in MultiQuoteSelector

Currently the last name is shown blurred (`blur-[4px]`). The user wants it fully removed.

### Changes in `src/components/dashboard/MultiQuoteSelector.tsx`

1. **Line 300-301** — Quoted assignments: Remove the blurred last name span, show only `{travelerFirstName}`
2. **Line 249** — Initials: Use only first name initial (drop last name initial)
3. **Line 364** — Pending assignments: Show only `assignment.traveler_first_name` instead of full name

