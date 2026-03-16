

## Re-evaluating: Multi-Traveler Assignment Architecture

### Current flow (from code analysis)
1. Admin selects ONE trip in `AdminMatchDialog` → calls `handleMatchPackage`
2. `handleMatchPackage` writes `matched_trip_id`, `admin_assigned_tip`, `traveler_address`, `matched_trip_dates` directly on the `packages` row, sets status to `matched`
3. Admin later changes status to `quote_sent` → `generateQuoteForAdminStatusChange` creates the quote based on the package's `admin_assigned_tip`
4. Shopper sees ONE quote → accepts/rejects
5. Everything downstream (payment, transit, delivery, payment_orders, trip_payment_accumulator) reads from `packages.matched_trip_id`

**`matched_trip_id` is referenced in 61 files.** This is the critical constraint.

---

### Three possible approaches

**Option A: Junction table `package_assignments`** (previously proposed)
- New table stores N candidate assignments, each with its own quote/tip/status
- Winner gets written back to `packages.matched_trip_id`
- Pros: Clean, normalized, auditable, each traveler has independent quote lifecycle
- Cons: New table, new RLS policies, new queries for traveler/shopper dashboards
- Downstream impact: **Minimal** — once shopper picks, `matched_trip_id` is set and everything after works unchanged

**Option B: JSONB array column on packages** (e.g. `candidate_assignments jsonb[]`)
- Store multiple `{trip_id, tip, quote, status}` objects in an array on the package
- Winner gets extracted to `matched_trip_id`
- Pros: No new table
- Cons: Hard to query (find all assignments for a traveler requires scanning all packages), no referential integrity, no RLS per-assignment, messy updates to individual array elements, can't do real-time subscriptions per assignment

**Option C: Duplicate packages** (create N copies)
- Create a copy of the package for each traveler candidate
- Pros: Reuses existing flow entirely
- Cons: Data duplication nightmare, shopper sees N separate packages instead of N quotes for one package, very confusing UX, hard to reconcile

---

### Verdict: Junction table (Option A) is the right approach

Option B sounds simpler but creates real problems:
- A traveler querying "show me packages assigned to me" requires a full table scan with jsonb array search instead of a simple `WHERE trip_id = X`
- Updating one traveler's quote inside a jsonb array is error-prone (concurrent updates, partial failures)
- No foreign key constraints, no independent RLS

Option A keeps the **blast radius minimal**: the only files that change significantly are the admin matching flow and the shopper/traveler views during the "bidding" phase. The 61 files referencing `matched_trip_id` stay untouched because once a shopper selects a winner, we write `matched_trip_id` and the entire downstream pipeline (payment, transit, delivery, payment_orders) works exactly as today.

### Refined implementation plan

**Phase 1 — Foundation (DB + Admin UI)**
- Create `package_assignments` table with RLS
- Modify `AdminMatchDialog` to allow multi-select of trips
- Modify `handleMatchPackage` to insert N assignments + set package status to `matched`
- Package status `matched` now means "has candidates, awaiting quotes"

**Phase 2 — Traveler side**
- Traveler dashboard reads from `package_assignments` (status = `pending`) to see assigned packages
- Existing quote flow works per-assignment

**Phase 3 — Shopper comparison + selection**
- New UI for shopper to compare quotes from multiple travelers
- On selection: write winner to `packages.matched_trip_id`, set assignment status, mark others as `not_selected`
- Everything downstream works unchanged

Shall I proceed with Phase 1?

