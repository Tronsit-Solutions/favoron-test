

## Investigation Results

### What I found
- **Database**: No UNIQUE constraint on `package_assignments`. The RPC logic correctly handles terminal statuses (`bid_cancelled`). Both trips have valid data.
- **Current state**: Package `fb569aa9` is still `approved`. Only one old assignment exists (José Sincuir, `bid_cancelled`). No new assignments were created.
- **Error logs**: No match-related errors in `client_errors` table. No network requests captured in the preview session.
- **Session replay**: Shows a "Asignando paquete..." loading toast appeared, meaning the dialog closed and the RPC was attempted — but it apparently failed without any visible error feedback reaching the user.

### Root Cause
The RPC call either failed silently (error not displayed) or hit a network timeout. The current error handling in `useDashboardActions.tsx` catches errors and shows a toast, but:
1. **No server-side error logging** — match failures aren't logged to `client_errors`, so we have zero visibility
2. **The error toast may have been dismissed too quickly** or the user didn't notice it among other toasts

The RPC itself is correct — I verified the function source, the data, and the schema. There is no constraint that would block this insert.

### Fix: Add error visibility

**File: `src/hooks/useDashboardActions.tsx`** — Inside `handleMatchPackage`, after the RPC fails (around line 1339):

1. **Log match failures to `client_errors`** so we have a permanent record:
```typescript
if (lastError) {
  // Log to client_errors for debugging
  supabase.from('client_errors').insert({
    message: `Match RPC failed: ${lastError.message}`,
    type: 'match_error',
    route: '/dashboard?tab=admin',
    context: {
      packageId,
      tripIds: tripIdsToAssign,
      adminTip,
      attempt: attempt,
      errorCode: lastError.code,
      errorDetails: lastError.details,
    }
  }).then(() => {}).catch(() => {});
  // ... existing toast error handling
}
```

2. **Add `console.error` with full error details** before the toast, including `error.code`, `error.details`, `error.hint` from the Supabase response.

3. **Persist the error toast longer** — change the error sonner toast to include `duration: 10000` so the admin has time to read it.

### What to do next
After deploying this fix, ask the user to **retry the assignment on the preview URL**. If it fails again, we'll have the exact error in `client_errors` and console. If it succeeds (which I expect based on the data), then the previous failure was a transient network issue.

### Files to change
1. `src/hooks/useDashboardActions.tsx` — Add error logging to `handleMatchPackage`
