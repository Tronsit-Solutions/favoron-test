

## Show Assigned Travelers in Package Detail Modal

### Problem
When a package has multi-traveler assignments (`matched_trip_id = null`), the "Información del Viajero" card doesn't render at all since it's gated by `{matchedTrip && ...}`. The admin sees no traveler info.

### Solution
Add a new section in `PackageDetailModal.tsx` that fetches `package_assignments` for the current package when there's no `matchedTrip`, and displays the assigned travelers with their status.

### Changes

**File: `src/components/admin/PackageDetailModal.tsx`**

1. **Fetch assignments on modal open** — Add a `useEffect` that queries `package_assignments` joined with `trips` and `public_profiles` for the current `pkg.id` when `matchedTrip` is null and status is `matched`
2. **New UI section after line 1229** — When `!matchedTrip` and assignments exist, render a Card titled "✈️ Viajeros Asignados (Xpax)" showing each traveler as a compact sub-card with:
   - Name, username, email
   - Assignment status badge (`pending` → "Esperando cotización", `quote_sent` → "Cotización enviada")
   - Trip route and dates (collapsible)
3. Keep the existing `matchedTrip` card unchanged for single-assignment packages

