

## Create Test Packages & Assignments for Trip 2bb2da73

**Trip**: `2bb2da73-0f45-42df-b7a8-fb2c5514385b` (New York → Guatemala City)
**Traveler**: `5e3c944e-9130-4ea7-8165-b8ec9d5abf6f`
**Second trip** (for bid_lost scenario): `10f0245f-9813-4823-89e3-647636d929c9`

### Data to Insert

**6 fake packages** (one per assignment status) with a test user_id, then **6 package_assignments**:

| # | Package Status | Assignment Status | Assigned Trip | Notes |
|---|---|---|---|---|
| 1 | `matched` | `bid_pending` | 2bb2da73 | Waiting for traveler response |
| 2 | `pending_purchase` | `bid_won` | 2bb2da73 | Traveler won the bid |
| 3 | `pending_purchase` | `bid_lost` | other trip | Lost to another traveler |
| 4 | `matched` | `bid_submitted` | 2bb2da73 | Quote submitted, awaiting shopper |
| 5 | `matched` | `bid_expired` | 2bb2da73 | 24h expired without response |
| 6 | `matched` | `bid_cancelled` | 2bb2da73 | Admin cancelled assignment |

### Implementation

1. **Insert 6 packages** into `packages` table with `item_description` like "TEST - Bid Pending", destination Guatemala, deadline in future, using the trip owner's user_id as package owner (or another existing user)
2. **Insert 6 package_assignments** linking each package to the appropriate trip with the corresponding status
3. For package #2 (bid_won), also set `matched_trip_id` on the package and populate `quote` JSON
4. For package #4 (bid_submitted), populate `quote` on the assignment row

All inserts via SQL using the migration/insert tool in implementation mode.

### Technical Detail

```sql
-- Example for one package + assignment pair
INSERT INTO packages (id, user_id, item_description, package_destination, purchase_origin, delivery_deadline, estimated_price, status)
VALUES (gen_random_uuid(), '<user_id>', 'TEST - Bid Pending', 'Guatemala City', 'United States', now() + interval '30 days', 50, 'matched');

INSERT INTO package_assignments (package_id, trip_id, status, admin_assigned_tip)
VALUES ('<pkg_id>', '2bb2da73-...', 'bid_pending', 25);
```

Repeated for all 6 scenarios with appropriate statuses and quote data.

