

## Data Correction: Fix "lulu shoes" Package Assignment Data

### Current State

**Package** `5c90d55b` ("lulu shoes"):
- `status: 'quote_sent'` — incorrect, should be `'matched'`
- `quote: {price: 120, serviceFee: 60, totalPrice: 180, ...}` — should be null at package level
- `quote_expires_at`, `traveler_address`, `matched_trip_dates` — all populated at package level

**Assignment** `3ee66370` (Lucas Farias, trip `3dda470f`):
- `status: 'pending'`, `quote: null` — should be `'quote_sent'` with the quote data

**Assignment** `1a3d76ee` (Administrador Favorón, trip `76747443`):
- `status: 'pending'`, `quote: null` — correct, this traveler hasn't quoted yet

### What Needs to Happen

Two data operations using the insert/update tool:

1. **Move quote data to the correct assignment** (`3ee66370`):
   - Set `status = 'quote_sent'`
   - Set `quote = {adminAssignedTipAccepted: true, deliveryFee: 0, message: '', price: 120, serviceFee: 60, totalPrice: 180}`
   - Set `traveler_address` = copy from package
   - Set `matched_trip_dates` = copy from package
   - Set `quote_expires_at` = 48h from now

2. **Reset the package** (`5c90d55b`):
   - Set `status = 'matched'` (back to competing state)
   - Clear `quote = null`
   - Clear `quote_expires_at = null`
   - Keep `traveler_address` and `matched_trip_dates` as-is (they're harmless at package level and may be needed as fallback)

### Files to Edit
None — this is a data-only fix using SQL update statements. The code changes from the previous messages already handle the correct flow going forward.

