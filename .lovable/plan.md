

## Fix: Simplify tripPackages filter by removing timer requirement

### Analysis

You're correct. There's a DB trigger (`expire_unresponded_assignments`) that runs on cron and automatically:
- Changes `status` from `matched` → `approved`
- Sets `matched_trip_id` to `NULL`
- Clears `matched_assignment_expires_at`

So when a timer expires, the package **leaves the `matched` status entirely** and its `matched_trip_id` becomes null — meaning it would naturally disappear from the filter on line 824 (`pkg.matched_trip_id !== trip.id`). The client-side timer check is redundant.

### Proposed change

In `Dashboard.tsx` line 827-838, simplify the filter to just:

```ts
const isMatched = pkg.status === 'matched';
const isPaidOrPostPayment = PAID_OR_POST_PAYMENT.includes(pkg.status);
const isExpiredQuote = pkg.status === 'quote_expired' || hasExpiredTimer;
const isMultiAssignment = pkg._isMultiAssignment;
return isMatched || isPaidOrPostPayment || isExpiredQuote || isMultiAssignment;
```

Remove the `isTimerActive` variable and its `matched_assignment_expires_at` check. Keep the `hasExpiredTimer` check for quote expiration (that's a different concern — quote timers don't change the status via trigger the same way).

### Risk assessment

**No risk.** If the cron hasn't fired yet and the timer technically expired, the traveler briefly sees the package — which is actually better UX than hiding it. The DB trigger will clean it up on the next cron run. Multi-assigned packages (with `_isMultiAssignment`) also benefit since they don't have `matched_assignment_expires_at` set at all.

### File
- **`src/components/Dashboard.tsx`** — lines 827-838: remove `isTimerActive` condition, replace with simple `isMatched` check, add `isMultiAssignment` passthrough.

