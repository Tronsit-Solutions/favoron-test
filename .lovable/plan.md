

## Phase 3: Shopper Quote Comparison & Selection

### Goal
When a package has multiple travelers assigned (via `package_assignments`), the shopper sees all submitted quotes side-by-side and can accept their preferred one. Accepting one auto-rejects the others.

### Current state
- Shopper sees `pkg.quote` (null for multi-assignments) and a single `PackageQuoteInfo` component
- `package_assignments` RLS already allows shoppers to SELECT assignments for their own packages
- The `CollapsiblePackageCard` shows "Match con viajero - Esperando cotización" for `matched` status

### Changes

**1. Fetch assignments for shopper's packages** — `src/components/Dashboard.tsx`
- When loading shopper packages, also query `package_assignments` for packages with status `matched` where `matched_trip_id IS NULL`
- Join with trips (for route/date info) and profiles (for traveler name/avatar)
- Store in a map: `packageAssignmentsMap[packageId] → assignment[]`

**2. New component: `MultiQuoteSelector`** — `src/components/dashboard/MultiQuoteSelector.tsx`
- Receives `assignments[]` for a given package
- Renders each assignment that has `status: 'quote_sent'` as a card with:
  - Traveler avatar, name, route, delivery date
  - Quote price breakdown (using `getQuoteValues` from the assignment's `quote` JSONB)
  - "Aceptar esta cotización" button
- Assignments with `status: 'pending'` show as "Esperando cotización de [Traveler]"
- If no quotes yet, shows a placeholder message

**3. Integrate into `CollapsiblePackageCard`** — `src/components/dashboard/CollapsiblePackageCard.tsx`
- For packages where `pkg.status === 'matched'` and `pkg.matched_trip_id === null` and assignments exist with quotes:
  - Replace the single `PackageQuoteInfo` with `MultiQuoteSelector`
  - Change status description to "Cotizaciones recibidas - Compara y elige"
  - Change action button to "Ver Cotizaciones" (instead of "Ver y Aceptar Cotización")

**4. Accept quote handler** — `src/hooks/useDashboardActions.tsx`
- New function `handleAcceptMultiAssignmentQuote(packageId, assignmentId)`
  - Reads the selected assignment's quote, tip, trip_id, traveler_address
  - Updates the package: sets `matched_trip_id`, `quote`, `admin_assigned_tip`, `traveler_address`, `matched_trip_dates`, `status: 'quote_sent'` (or directly `payment_pending` depending on flow)
  - Updates the winning assignment: `status: 'quote_accepted'`
  - Updates all other assignments for this package: `status: 'rejected'`
  - Triggers WhatsApp notification to shopper

**5. DB migration** — No schema changes needed. `package_assignments` already has all required columns. RLS policies already allow shoppers to SELECT their package's assignments. However, shoppers currently cannot UPDATE assignments — we need either:
  - An RPC function `shopper_accept_assignment(package_id, assignment_id)` with `SECURITY DEFINER` that validates ownership, updates the package, accepts the winning assignment, and rejects others atomically
  - This is the safest approach since it prevents race conditions and ensures all updates happen in one transaction

### RPC function: `shopper_accept_assignment`
```sql
CREATE OR REPLACE FUNCTION shopper_accept_assignment(_package_id uuid, _assignment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _assignment record;
  _package record;
BEGIN
  -- Verify package ownership
  SELECT * INTO _package FROM packages WHERE id = _package_id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'No tienes permisos para este paquete'; END IF;
  
  -- Get winning assignment with quote
  SELECT * INTO _assignment FROM package_assignments 
  WHERE id = _assignment_id AND package_id = _package_id AND status = 'quote_sent' AND quote IS NOT NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Asignación no válida o sin cotización'; END IF;
  
  -- Update package with winning traveler's data
  UPDATE packages SET
    matched_trip_id = _assignment.trip_id,
    quote = _assignment.quote,
    admin_assigned_tip = _assignment.admin_assigned_tip,
    traveler_address = _assignment.traveler_address,
    matched_trip_dates = _assignment.matched_trip_dates,
    status = 'quote_sent',
    quote_expires_at = _assignment.quote_expires_at,
    updated_at = now()
  WHERE id = _package_id;
  
  -- Accept winning assignment
  UPDATE package_assignments SET status = 'quote_accepted', updated_at = now()
  WHERE id = _assignment_id;
  
  -- Reject all other assignments
  UPDATE package_assignments SET status = 'rejected', updated_at = now()
  WHERE package_id = _package_id AND id != _assignment_id;
END;
$$;
```

### Files to create/edit
- **New**: `src/components/dashboard/MultiQuoteSelector.tsx`
- **Edit**: `src/components/Dashboard.tsx` — fetch assignments for shopper packages, pass to cards
- **Edit**: `src/components/dashboard/CollapsiblePackageCard.tsx` — render `MultiQuoteSelector` for multi-assignment packages
- **Edit**: `src/hooks/useDashboardActions.tsx` — add `handleAcceptMultiAssignmentQuote` calling the RPC
- **Migration**: Create `shopper_accept_assignment` RPC function

