

## Unify Single and Multi Assignment Paths (Without Auto-Resolve)

You're right — even with 1 traveler assigned, the admin might add another one later. So we should never auto-promote. The shopper should always go through the selection flow (even if there's only 1 quote available).

### Changes Required

**1. `src/hooks/useDashboardActions.tsx` — `handleMatchPackage` (~lines 1272-1311)**

Remove the single/multi branch. Always:
- Insert `package_assignments` row(s) 
- Set package `status: 'matched'` WITHOUT setting `matched_trip_id`
- `matched_trip_id` only gets set when `shopper_accept_assignment` RPC runs

This means even a 1-traveler match starts in assignment mode, and the admin can later add more travelers.

**2. `src/components/admin/AdminActionsModal.tsx` — Remove `isMultiAssignment` branch (~lines 175-290)**

Since all packages now use assignments, remove the `!pkg.matched_trip_id` check. All `matched → quote_sent` transitions write to `package_assignments`. The package stays in `status: 'matched'` until the shopper picks a winner.

**3. `src/components/admin/AdminMatchDialog.tsx` — Allow re-opening for already-matched packages**

Currently only accessible from "Pending Requests." Need to:
- Add an "Assign more travelers" action to packages in the Matches tab that are still in `matched` state
- When opened for an already-assigned package, pre-load existing assignments and let admin select additional trips
- On submit, only insert NEW assignment rows (skip already-assigned trips)

**4. `src/hooks/useDashboardActions.tsx` — Traveler quote submission**

The traveler flow already has a `_isMultiAssignment` branch. With unification, ALL packages go through the assignment path — the traveler always updates their specific `package_assignments` row.

**5. Backward compatibility for legacy packages**

Existing packages with `matched_trip_id` set but no `package_assignments` rows should continue working. Add graceful fallback: if `matched_trip_id` is set and no assignments exist, treat as legacy single-assignment (no changes to those flows).

**6. Shopper UX for single-quote packages**

The `MultiQuoteSelector` should work even with just 1 quote — the shopper sees 1 option and accepts it. This keeps the flow uniform and allows future quotes to appear if another traveler is added later.

### Files to Edit
- `src/hooks/useDashboardActions.tsx` — Unify match logic + traveler quote path
- `src/components/admin/AdminActionsModal.tsx` — Remove multi/single branching
- `src/components/admin/AdminMatchDialog.tsx` — Support adding travelers to existing matches
- `src/components/admin/matching/ActiveMatchesTab.tsx` or `MatchCard.tsx` — Add "assign more" button

