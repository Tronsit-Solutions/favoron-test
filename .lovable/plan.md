

## Add notification bubble on the trip selector trigger

### Problem
The notification badges only appear inside the dropdown items when the selector is open. The traveler has no way to know there are pending notifications on other trips without opening the dropdown.

### Solution

**File: `src/components/dashboard/TripSelector.tsx`**

1. Calculate the **total pending count across all non-selected trips** from `pendingCountByTrip`.
2. Show a `NotificationBadge` next to the `SelectTrigger` (outside/beside it) so it's always visible when the dropdown is closed.
3. This badge shows the sum of pending items on trips other than the currently selected one, alerting the traveler to check other trips.

### Layout
```text
[ ◉ Nash → Guatemala City  30 sep 2025  ▼ ]  🔴 3
```

The badge sits to the right of the trigger, using a flex container. It only appears when there are pending items on non-selected trips.

### Technical detail

- Wrap `Select` + `NotificationBadge` in a `flex items-center gap-2` div
- Compute: `totalOtherPending = sum of pendingCountByTrip values excluding selectedTripId`
- Render `<NotificationBadge count={totalOtherPending} />` next to the trigger

Single file change: `src/components/dashboard/TripSelector.tsx`

