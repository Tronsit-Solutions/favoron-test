

## Fix: "No se pudo descartar el paquete" error for terminal assignments

### Root cause

There are **two dismiss paths** that collide:

1. **Card-level** (`handleDismissAssignment`, line 84): Updates `package_assignments.dismissed_by_traveler = true` directly — this **succeeds**.
2. **Dashboard-level** (`onDismissExpiredPackage` → `handleDismissExpiredPackage`): Calls the `traveler_dismiss_package` RPC — this **fails** because the RPC requires `matched_trip_id` to be non-null, but in the multi-assignment architecture, terminal packages often have `matched_trip_id = NULL`.

The problem: after the card-level update succeeds (line 92), it immediately calls `onDismissExpiredPackage?.(pkg.id)` on line 95, triggering the RPC which throws "Paquete no asignado a ningún viaje" → the error toast overrides the success toast.

### Solution

**1. `CollapsibleTravelerPackageCard.tsx`** — Remove the `onDismissExpiredPackage` call from `handleDismissAssignment`. The direct `package_assignments` update is sufficient for multi-assignment dismissals. After success, just set `dismissed(true)` (already there) which hides the card optimistically.

```ts
// Line 95: remove onDismissExpiredPackage?.(pkg.id);
```

**2. `traveler_dismiss_package` RPC (migration)** — Update the function to also handle multi-assignment dismissals. Instead of failing when `matched_trip_id IS NULL`, check the `package_assignments` table for ownership:

- If `matched_trip_id` is not null → existing logic (legacy path)
- If `matched_trip_id` is null → find assignment via `package_assignments` where `trip_id` belongs to the traveler, mark it `dismissed_by_traveler = true`

This ensures the fallback dismiss buttons (for packages without `_assignmentId`) also work.

### Changes
- 1 file edited: `CollapsibleTravelerPackageCard.tsx`
- 1 migration: update `traveler_dismiss_package` RPC

