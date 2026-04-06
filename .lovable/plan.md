

## Plan: Add Assignment Stats and Traveler History to Trip Cards

### What you'll see

Each trip card in "Viajes disponibles" will show two new compact sections:

**1. Assignment stats (this trip)** — colored badges showing:
- 🟢 Respondidos (bid_submitted + bid_won + bid_lost + bid_expired WHERE quote IS NOT NULL)
- 🔴 Sin respuesta (bid_expired WHERE quote IS NULL)
- 🟡 Pendientes (bid_pending)
- ⚪ Cancelados (bid_cancelled) — only if > 0

**2. Traveler track record** — small text line:
- "X viajes completados · Y paquetes entregados"
- Shows below traveler name, using data from all their historical trips

### How we distinguish "responded" vs "no response"

The `quote` field in `package_assignments` tells us:
- `bid_expired` + `quote IS NULL` = traveler never responded (24h timeout)
- `bid_expired` + `quote IS NOT NULL` = traveler responded but shopper didn't accept (48h timeout)

### Technical approach

**1. Create `src/hooks/useTripAssignmentStats.ts`**

Single hook that takes an array of `{ tripId, userId }` and fetches:
- All `package_assignments` for those trip IDs → group by trip, categorize by status + quote presence
- Traveler history: count of trips with `completed_paid` status and packages with `completed`/`completed_paid` status per unique user_id
- Uses two parallel Supabase queries, returns a map keyed by tripId

**2. Modify `src/components/admin/matching/AvailableTripsTab.tsx`**

- Call the hook with filtered trip IDs/user IDs
- Pass stats to each TripCard

**3. Modify `src/components/admin/matching/TripCard.tsx`**

- Add optional `assignmentStats` and `travelerHistory` props
- Render compact badge row for assignments between traveler info and dates
- Render "X viajes · Y entregas" text next to or below the traveler name

### Files
1. **Create** `src/hooks/useTripAssignmentStats.ts`
2. **Modify** `src/components/admin/matching/AvailableTripsTab.tsx`
3. **Modify** `src/components/admin/matching/TripCard.tsx`

