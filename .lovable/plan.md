

## Fix: Exclude packages with expired quotes from TripTipsModal

The modal currently shows all packages in `ALL_ACTIVE_STATUSES`, but doesn't filter out packages whose quotes have expired. The "Crocs" package appears because its status is still `quote_accepted` (or similar) even though `quote_expires_at` has passed.

### Changes

**`src/components/dashboard/TripTipsModal.tsx`**:
- Add `quote_expires_at` to the select query
- After fetching, filter out packages in pre-payment states (`quote_sent`, `quote_accepted`, `payment_pending`) where `quote_expires_at` is in the past
- This ensures expired quotes don't inflate the tip total or appear in the package list

