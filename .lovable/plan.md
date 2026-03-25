

## Fix: Match Confirmation Delay

### Root Cause
In `AdminDashboard.tsx` line 257, the success toast ("¡Match exitoso!") only appears **after** `await onMatchPackage(...)` completes. This function makes 2 sequential network calls to Supabase:
1. SELECT active assignments (to filter duplicates)
2. INSERT assignments + UPDATE package status (in parallel)

Even though the dialog closes immediately via optimistic update, the user sees "Procesando match..." and waits for the DB operations to finish before getting confirmation — which can take several seconds depending on network latency.

### Solution
Since the optimistic update already updates the UI instantly, we can run the actual DB operations as fire-and-forget (non-blocking). Show the success toast immediately after closing the dialog. If the DB operation fails, show an error toast and revert the optimistic update.

### Changes

**File: `src/components/AdminDashboard.tsx`** (lines 233-277)
- Move the success toast to fire **immediately** after the optimistic update and dialog close
- Run `onMatchPackage(...)` without `await` — as a `.catch()` handler that shows an error toast and reverts the optimistic state if it fails
- Remove the "Procesando match..." intermediate toast since the operation will appear instant

**File: `src/hooks/useDashboardActions.tsx`** (line 1404)
- Remove the duplicate success toast inside `handleMatchPackage` (it already exists in `AdminDashboard.handleMatch`)

### Result
The admin will see the dialog close and "¡Match exitoso!" immediately. DB operations run silently in background. On the rare failure, an error toast appears and the package reverts to its previous status.

