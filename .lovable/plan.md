

## Fix: Traveler Quote Submission for Multi-Assignment Packages

### Problem
When a traveler submits a quote for a package with multiple competing travelers, two things go wrong:

1. **Quote submission updates the package directly** (`useDashboardActions.tsx` line 399): Sets `packages.status = 'quote_sent'` and `packages.quote = {...}` — but **never updates** the `package_assignments` row. The assignment stays `status: 'pending'` with `quote: null`.

2. **Shopper can't see assignments**: The shopper-side fetch (`Dashboard.tsx` line 328) filters for `p.status === 'matched'`, but the package status was changed to `quote_sent`, so the multi-assignment query returns nothing. The shopper sees a generic "quote_sent" card instead of the multi-quote selector.

### Root Cause
The quote submission flow was built for single-assignment only. It writes directly to the `packages` table. For multi-assignment (competing) packages, it should write to `package_assignments` and keep the package status as `matched` until the shopper picks a winner.

### Changes

**File: `src/hooks/useDashboardActions.tsx`** — In `handleQuoteSubmit`, around line 389-430 (the `isTravelerAcceptingAssignedTip` block):

1. **Detect multi-assignment**: Check if `selectedPackage._isMultiAssignment` is true
2. **If multi-assignment**:
   - Update the `package_assignments` row (using `selectedPackage._assignmentId`) with `status: 'quote_sent'`, `quote`, `traveler_address`, `matched_trip_dates`, `quote_expires_at`
   - **Do NOT** change the package-level status — keep it as `matched`
   - Set `quote_expires_at` on the assignment (48h from now)
3. **If single-assignment**: Keep existing behavior (update package directly)

**File: `src/components/Dashboard.tsx`** — In the shopper-side assignment fetch (line 327-328):

4. **Broaden the filter**: Change from `p.status === 'matched'` to also include packages with `status === 'quote_sent'` that have no `matched_trip_id` (these are multi-assignment packages where the package status was incorrectly changed by the old code)

**Data fix**: The existing "lulu shoes" package has incorrect state (package `status: quote_sent` with both assignments `pending`). The code fix will handle this going forward, and the broadened shopper filter will make existing broken data visible too.

### Files to edit
- `src/hooks/useDashboardActions.tsx` — multi-assignment aware quote submission
- `src/components/Dashboard.tsx` — broaden shopper assignment filter

